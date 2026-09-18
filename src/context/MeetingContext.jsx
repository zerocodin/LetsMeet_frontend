import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import meetingService from "../services/meeting.Service";
import { getSocket, connectSocket, disconnectSocket } from "../lib/socket";

const MeetingContext = createContext(null);

export function MeetingProvider({ children }) {
	const navigate = useNavigate();

	// core state
	const [meeting, setMeeting] = useState(null); // { _id, title, meetingCode, host, ... }
	const [myParticipant, setMyParticipant] = useState(null); // { _id, role, ... }
	const [participants, setParticipants] = useState([]); // live list (from socket)
	const [status, setStatus] = useState("IDLE"); // IDLE | WAITING | JOINED | ENDED

	// Local media state (mirrored to DB + socket)
	const [isMuted, setIsMuted] = useState(false);
	const [isCameraOff, setIsCameraOff] = useState(false);
	const [isScreenSharing, setIsScreenSharing] = useState(false);

	// WebRTC refs (populated by useWebRTC later)
	const peerConnections = useRef(new Map()); // socketId → RTCPeerConnection
	const localStreamRef = useRef(null); // MediaStream
	const screenStreamRef = useRef(null); // MediaStream (when sharing)

	//Socket listeners bound once per join
	const socketListenersBound = useRef(false);

	// HELPERS

	const bindSocketListeners = useCallback(() => {
		if (socketListenersBound.current) return;
		const socket = getSocket();
		socketListenersBound.current = true;

		// New participant joined
		socket.on("participant-joined", (p) => {
			setParticipants((prev) => {
				// Guard against duplicate socketIds
				if (prev.some((x) => x.socketId === p.socketId)) return prev;
				return [...prev, p];
			});
		});

		// Participant left
		socket.on("participant-left", ({ socketId }) => {
			setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
		});

		// Media state update (mute / camera / screen-share)
		socket.on("participant-state-changed", (update) => {
			setParticipants((prev) =>
				prev.map((p) =>
					p.socketId === update.socketId ? { ...p, ...update } : p
				)
			);
		});

		// Host ended the meeting
		socket.on("meeting-ended", () => {
			toast("Host ended the meeting", { icon: "📞" });
			handleRemoteEnd();
		});

		// Kicked by host
		socket.on("kicked", () => {
			toast.error("You were removed from the meeting");
			handleRemoteEnd();
		});
	}, []);

	const unbindSocketListeners = useCallback(() => {
		const socket = getSocket();
		socket.off("participant-joined");
		socket.off("participant-left");
		socket.off("participant-state-changed");
		socket.off("meeting-ended");
		socket.off("kicked");
		socketListenersBound.current = false;
	}, []);

	/**
	 * Cleanup when meeting ends for any reason (host ended / we were kicked)
	 * We intentionally DON'T ask the server to leave — that already happened.
	 */
	const handleRemoteEnd = useCallback(() => {
		setStatus("ENDED");
		unbindSocketListeners();
		disconnectSocket();
		peerConnections.current.forEach((pc) => pc.close());
		peerConnections.current.clear();

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((t) => t.stop());
			localStreamRef.current = null;
		}
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((t) => t.stop());
			screenStreamRef.current = null;
		}

		setMeeting(null);
		setMyParticipant(null);
		setParticipants([]);
		navigate("/home");
	}, [navigate, unbindSocketListeners]);

	// CREATE MEETING (no room join yet)
	const createMeeting = useCallback(async (payload) => {
		try {
			const res = await meetingService.createMeeting(payload);
			return res; // { success, data: { meetingCode, meetingLink, password } }
		} catch (err) {
			toast.error(err.message || "Failed to create meeting");
			throw err;
		}
	}, []);

	// JOIN MEETING
	const joinByCode = useCallback(
		async ({ meetingCode, password }) => {
			try {
				const res = await meetingService.joinMeeting({
					meetingCode,
					password,
				});

				// Waiting room case
				if (res.status === "WAITING") {
					setMeeting(res.data.meeting);
					setStatus("WAITING");
					return res;
				}

				// Joined
				if (res.status === "JOINED") {
					setMeeting(res.data.meeting);
					setMyParticipant(res.data.participant);
					setIsMuted(res.data.participant.isMuted);
					setIsCameraOff(res.data.participant.isCameraOff);
					setIsScreenSharing(res.data.participant.isScreenSharing);

					// Connect socket + bind listeners
					connectSocket();
					bindSocketListeners();

					// Join the socket room
					const socket = getSocket();
					socket.emit("join-meeting", { meetingId: res.data.meeting._id }, (ack) => {
						if (!ack?.success) {
							toast.error(ack?.message || "Failed to join room");
							return;
						}
						// ack.participants = existing participants (excluding me)
						setParticipants(ack.participants || []);
					});

					setStatus("JOINED");
					return res;
				}

				return res;
			} catch (err) {
				// Bubble up password/waiting signals so the UI can react
				throw err;
			}
		},
		[bindSocketListeners]
	);

	const joinById = useCallback(
		async ({ meetingId, password }) => {
			try {
				const res = await meetingService.joinMeeting({
					meetingId,
					password,
				});

				if (res.status === "WAITING") {
					setMeeting(res.data.meeting);
					setStatus("WAITING");
					return res;
				}

				if (res.status === "JOINED") {
					setMeeting(res.data.meeting);
					setMyParticipant(res.data.participant);
					setIsMuted(res.data.participant.isMuted);
					setIsCameraOff(res.data.participant.isCameraOff);
					setIsScreenSharing(res.data.participant.isScreenSharing);

					connectSocket();
					bindSocketListeners();

					const socket = getSocket();
					socket.emit("join-meeting", { meetingId: res.data.meeting._id }, (ack) => {
						if (!ack?.success) {
							toast.error(ack?.message || "Failed to join room");
							return;
						}
						setParticipants(ack.participants || []);
					});

					setStatus("JOINED");
					return res;
				}
				return res;
			} catch (err) {
				throw err;
			}
		},
		[bindSocketListeners]
	);

	// LEAVE / END
	const leave = useCallback(async () => {
		if (!meeting?._id) return;

		try {
			// Notify via socket first for instant UX
			const socket = getSocket();
			if (socket?.connected) socket.emit("leave-meeting");

			// Then persist via REST (idempotent)
			const res = await meetingService.leaveMeeting(meeting._id);

			// Cleanup local state
			unbindSocketListeners();
			disconnectSocket();
			peerConnections.current.forEach((pc) => pc.close());
			peerConnections.current.clear();

			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach((t) => t.stop());
				localStreamRef.current = null;
			}
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((t) => t.stop());
				screenStreamRef.current = null;
			}

			setMeeting(null);
			setMyParticipant(null);
			setParticipants([]);
			setStatus("IDLE");

			// If host → meeting ended for all → go home; else also go home
			if (res?.data?.meetingEnded) {
				toast.success("Meeting ended for all");
			} else {
				toast.success("Left the meeting");
			}
			navigate("/home");
			return res;
		} catch (err) {
			toast.error(err.message || "Failed to leave meeting");
			throw err;
		}
	}, [meeting, navigate, unbindSocketListeners]);

	// MEDIA TOGGLES (persist + broadcast)
	const toggleMute = useCallback(async () => {
		if (!meeting?._id) return;
		const next = !isMuted;
		setIsMuted(next);

		const socket = getSocket();
		if (socket?.connected) socket.emit("toggle-mute", { isMuted: next });

		try {
			await meetingService.updateMyState(meeting._id, { isMuted: next });
		} catch (err) {
			console.error("Failed to persist mute state:", err);
		}
	}, [meeting, isMuted]);

	const toggleCamera = useCallback(async () => {
		if (!meeting?._id) return;
		const next = !isCameraOff;
		setIsCameraOff(next);

		const socket = getSocket();
		if (socket?.connected) socket.emit("toggle-camera", { isCameraOff: next });

		try {
			await meetingService.updateMyState(meeting._id, { isCameraOff: next });
		} catch (err) {
			console.error("Failed to persist camera state:", err);
		}
	}, [meeting, isCameraOff]);

	const toggleScreenShare = useCallback(async () => {
		if (!meeting?._id) return;
		const next = !isScreenSharing;
		setIsScreenSharing(next);

		const socket = getSocket();
		if (socket?.connected)
			socket.emit("toggle-screen-share", { isScreenSharing: next });

		try {
			await meetingService.updateMyState(meeting._id, {
				isScreenSharing: next,
			});
		} catch (err) {
			console.error("Failed to persist screen-share state:", err);
		}
	}, [meeting, isScreenSharing]);

	// HOST ACTIONS (REST for DB + socket event for real-time)
	const hostMute = useCallback(
		async (participantId, targetSocketId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.muteParticipant(meeting._id, participantId);

				const socket = getSocket();
				if (socket?.connected && targetSocketId) {
					socket.emit("host-mute-user", { targetSocketId });
				}

				// Optimistic update
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId ? { ...p, isMuted: true } : p
					)
				);
			} catch (err) {
				toast.error(err.message || "Failed to mute participant");
			}
		},
		[meeting]
	);

	const hostUnmute = useCallback(
		async (participantId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.unmuteParticipant(meeting._id, participantId);
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId ? { ...p, isMuted: false } : p
					)
				);
			} catch (err) {
				toast.error(err.message || "Failed to unmute participant");
			}
		},
		[meeting]
	);

	const hostRemove = useCallback(
		async (participantId, targetSocketId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.removeParticipant(meeting._id, participantId);

				const socket = getSocket();
				if (socket?.connected && targetSocketId) {
					socket.emit("host-kick-user", { targetSocketId });
				}

				setParticipants((prev) =>
					prev.filter((p) => p.participantId !== participantId)
				);
			} catch (err) {
				toast.error(err.message || "Failed to remove participant");
			}
		},
		[meeting]
	);

	const hostPromote = useCallback(
		async (participantId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.promoteToCohost(meeting._id, participantId);
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId ? { ...p, role: "COHOST" } : p
					)
				);
			} catch (err) {
				toast.error(err.message || "Failed to promote participant");
			}
		},
		[meeting]
	);

	const hostDemote = useCallback(
		async (participantId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.demoteFromCohost(meeting._id, participantId);
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId
							? { ...p, role: "PARTICIPANT" }
							: p
					)
				);
			} catch (err) {
				toast.error(err.message || "Failed to demote participant");
			}
		},
		[meeting]
	);

	const hostEndForAll = useCallback(async () => {
		if (!meeting?._id) return;
		try {
			const socket = getSocket();
			if (socket?.connected) socket.emit("host-end-meeting");

			// Persist via leave (host leaving = end for all)
			await meetingService.leaveMeeting(meeting._id);

			unbindSocketListeners();
			disconnectSocket();
			peerConnections.current.forEach((pc) => pc.close());
			peerConnections.current.clear();

			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach((t) => t.stop());
				localStreamRef.current = null;
			}
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((t) => t.stop());
				screenStreamRef.current = null;
			}

			setMeeting(null);
			setMyParticipant(null);
			setParticipants([]);
			setStatus("IDLE");
			navigate("/home");
		} catch (err) {
			toast.error(err.message || "Failed to end meeting");
		}
	}, [meeting, navigate, unbindSocketListeners]);

	// CONTEXT VALUE
	const value = {
		// state
		meeting,
		myParticipant,
		participants,
		status,
		isMuted,
		isCameraOff,
		isScreenSharing,

		// refs (for WebRTC hook)
		peerConnections,
		localStreamRef,
		screenStreamRef,

		// actions
		createMeeting,
		joinByCode,
		joinById,
		leave,
		toggleMute,
		toggleCamera,
		toggleScreenShare,

		// host
		hostMute,
		hostUnmute,
		hostRemove,
		hostPromote,
		hostDemote,
		hostEndForAll,

		// helpers
		handleRemoteEnd,
	};

	return (
		<MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
	);
}

export const useMeeting = () => {
	const ctx = useContext(MeetingContext);
	if (!ctx) throw new Error("useMeeting must be used within MeetingProvider");
	return ctx;
};