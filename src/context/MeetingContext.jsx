import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";

import chatService from "../services/chat.Service";
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
	const [remoteIsRecording, setRemoteIsRecording] = useState(false);

	// WebRTC refs (populated by useWebRTC later)
	const peerConnections = useRef(new Map()); // socketId → RTCPeerConnection
	const localStreamRef = useRef(null); // MediaStream
	const screenStreamRef = useRef(null); // MediaStream (when sharing)

	//Socket listeners bound once per join
	const socketListenersBound = useRef(false);
	const isChatPanelOpenRef = useRef(false);

	// Chat state
	const [messages, setMessages] = useState([]);
	const [chatLoading, setChatLoading] = useState(true);
	const [chatHasMore, setChatHasMore] = useState(false);
	const [chatLoadingMore, setChatLoadingMore] = useState(false);
	const [unreadChatCount, setUnreadChatCount] = useState(0);
	const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

	const chatCursorRef = useRef(null);
	const chatSeenIdsRef = useRef(new Set());

	// HELPERS

	const unbindSocketListeners = useCallback(() => {
		const socket = getSocket();
		socket.off("participant-joined");
		socket.off("participant-left");
		socket.off("participant-state-changed");
		socket.off("meeting-ended");
		socket.off("kicked");
		socketListenersBound.current = false;
	}, []);

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
					p.socketId === update.socketId ? { ...p, ...update } : p,
				),
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

	// Action — called by host after starting local recording
	const broadcastRecordingStart = useCallback(() => {
		const socket = getSocket();
		if (socket?.connected && meeting?._id) {
			socket.emit("recording-started");
		}
	}, [meeting]);

	const broadcastRecordingStop = useCallback(() => {
		const socket = getSocket();
		if (socket?.connected && meeting?._id) {
			socket.emit("recording-stopped");
		}
	}, [meeting]);

	//  Chat: load history
	const loadChatHistory = useCallback(async () => {
		if (!meeting?._id) return;

		setChatLoading(true);

		try {
			const res = await chatService.getHistory(meeting._id, { limit: 50 });

			chatSeenIdsRef.current = new Set();
			res.data.forEach((m) => chatSeenIdsRef.current.add(m._id));

			setMessages(res.data);
			setChatHasMore(!!res.hasMore);
			chatCursorRef.current = res.nextCursor;
		} catch (err) {
			toast.error(err.message || "Failed to load chat");
		} finally {
			setChatLoading(false);
		}
	}, [meeting?._id]);

	//  Chat: add message
	const addChatMessage = useCallback((msg) => {
		if (!msg?._id) return;
		if (chatSeenIdsRef.current.has(msg._id)) return;

		chatSeenIdsRef.current.add(msg._id);
		setMessages((prev) =>
			[...prev, msg].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)),
		);

		// Increment unread if panel is closed
		if (!isChatPanelOpenRef.current) setUnreadChatCount((c) => c + 1);
	}, []);

	//  Chat: load older
	const loadOlderMessages = useCallback(async () => {
		if (!chatHasMore || chatLoadingMore || !chatCursorRef.current) return;
		if (!meeting?._id) return;

		setChatLoadingMore(true);
		try {
			const res = await chatService.getHistory(meeting._id, {
				before: chatCursorRef.current,
				limit: 50,
			});

			const fresh = res.data.filter((m) => !chatSeenIdsRef.current.has(m._id));
			fresh.forEach((m) => chatSeenIdsRef.current.add(m._id));

			setMessages((prev) => [...fresh, ...prev]);
			setChatHasMore(!!res.hasMore);
			chatCursorRef.current = res.nextCursor;
		} catch (err) {
			toast.error(err.message || "Failed to load more");
		} finally {
			setChatLoadingMore(false);
		}
	}, [meeting?._id, chatHasMore, chatLoadingMore]);

	//  Chat: send
	const sendChatMessage = useCallback((text) => {
		const trimmed = text?.trim();
		if (!trimmed) return;

		const socket = getSocket();
		if (!socket?.connected) {
			toast.error("Not connected");
			return;
		}

		socket.emit("send-chat", { message: trimmed }, (ack) => {
			if (!ack?.success) {
				toast.error(ack?.message || "Failed to send");
			}
		});
	}, []);

	//  Chat: delete
	const deleteChatMessageById = useCallback(
		async (messageId) => {
			if (!meeting?._id) return;
			try {
				await chatService.deleteMessage(meeting._id, messageId);
				setMessages((prev) => prev.filter((m) => m._id !== messageId));

				const socket = getSocket();
				if (socket?.connected) {
					socket.emit("chat-message-deleted", {
						meetingId: meeting._id,
						messageId,
					});
				}
			} catch (err) {
				toast.error(err.message || "Failed to delete");
			}
		},
		[meeting],
	);

	//  Chat: panel open/close
	const openChatPanel = useCallback(() => {
		setIsChatPanelOpen(true);
		setUnreadChatCount(0);
	}, []);

	const closeChatPanel = useCallback(() => setIsChatPanelOpen(false), []);

	//  Chat: reset on leave
	const resetChat = useCallback(() => {
		setMessages([]);
		setUnreadChatCount(0);
		setIsChatPanelOpen(false);
		setChatLoading(true);
		setChatHasMore(false);
		chatSeenIdsRef.current = new Set();
		chatCursorRef.current = null;
	}, []);

	// Socket listener — when someone else starts/stops recording
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;

		const onStart = () => setRemoteIsRecording(true);
		const onStop = () => setRemoteIsRecording(false);

		socket.on("recording-started", onStart);
		socket.on("recording-stopped", onStop);

		return () => {
			socket.off("recording-started", onStart);
			socket.off("recording-stopped", onStop);
		};
	}, [meeting]);

	useEffect(() => {
		if (!meeting?._id) return;

		loadChatHistory();

		const socket = getSocket();
		if (!socket) return;

		const onChatMessage = (msg) => addChatMessage(msg);
		const onChatDeleted = ({ messageId }) => {
			setMessages((prev) => prev.filter((m) => m._id !== messageId));
		};

		socket.on("chat-message", onChatMessage);
		socket.on("chat-message-deleted", onChatDeleted);

		return () => {
			socket.off("chat-message", onChatMessage);
			socket.off("chat-message-deleted", onChatDeleted);
		};
	}, [meeting?._id]);

	useEffect(() => {
		isChatPanelOpenRef.current = isChatPanelOpen;
	}, [isChatPanelOpen]);

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
					socket.emit(
						"join-meeting",
						{ meetingId: res.data.meeting._id },
						(ack) => {
							if (!ack?.success) {
								toast.error(ack?.message || "Failed to join room");
								return;
							}
							// ack.participants = existing participants (excluding me)
							setParticipants(ack.participants || []);
						},
					);

					setStatus("JOINED");
					return res;
				}

				return res;
			} catch (err) {
				// Bubble up password/waiting signals so the UI can react
				throw err;
			}
		},
		[bindSocketListeners],
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
					socket.emit(
						"join-meeting",
						{ meetingId: res.data.meeting._id },
						(ack) => {
							if (!ack?.success) {
								toast.error(ack?.message || "Failed to join room");
								return;
							}
							setParticipants(ack.participants || []);
						},
					);

					setStatus("JOINED");
					return res;
				}
				return res;
			} catch (err) {
				throw err;
			}
		},
		[bindSocketListeners],
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
						p.participantId === participantId ? { ...p, isMuted: true } : p,
					),
				);
			} catch (err) {
				toast.error(err.message || "Failed to mute participant");
			}
		},
		[meeting],
	);

	const hostUnmute = useCallback(
		async (participantId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.unmuteParticipant(meeting._id, participantId);
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId ? { ...p, isMuted: false } : p,
					),
				);
			} catch (err) {
				toast.error(err.message || "Failed to unmute participant");
			}
		},
		[meeting],
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
					prev.filter((p) => p.participantId !== participantId),
				);
			} catch (err) {
				toast.error(err.message || "Failed to remove participant");
			}
		},
		[meeting],
	);

	const hostPromote = useCallback(
		async (participantId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.promoteToCohost(meeting._id, participantId);
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId ? { ...p, role: "COHOST" } : p,
					),
				);
			} catch (err) {
				toast.error(err.message || "Failed to promote participant");
			}
		},
		[meeting],
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
							: p,
					),
				);
			} catch (err) {
				toast.error(err.message || "Failed to demote participant");
			}
		},
		[meeting],
	);

	const hostStopShare = useCallback(
		async (participantId, targetSocketId) => {
			if (!meeting?._id) return;
			try {
				await meetingService.stopScreenShare(meeting._id, participantId);

				const socket = getSocket();
				if (socket?.connected && targetSocketId) {
					socket.emit("host-stop-share", { targetSocketId });
				}

				// Optimistic update
				setParticipants((prev) =>
					prev.map((p) =>
						p.participantId === participantId
							? { ...p, isScreenSharing: false }
							: p,
					),
				);
			} catch (err) {
				toast.error(err.message || "Failed to stop screen share");
			}
		},
		[meeting],
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
		remoteIsRecording,

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
		broadcastRecordingStart,
		broadcastRecordingStop,

		// chat
		messages,
		chatLoading,
		chatHasMore,
		chatLoadingMore,
		unreadChatCount,
		isChatPanelOpen,
		loadChatHistory,
		loadOlderMessages,
		sendChatMessage,
		deleteChatMessageById,
		openChatPanel,
		closeChatPanel,
		resetChat,

		// host
		hostMute,
		hostUnmute,
		hostRemove,
		hostPromote,
		hostDemote,
		hostEndForAll,
		hostStopShare,

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
