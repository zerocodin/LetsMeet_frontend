import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import { useMeeting } from "../context/MeetingContext";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useWebRTC } from "../hooks/useWebRTC";
import { useMediaSync } from "../hooks/useMediaSync";
import { useActiveSpeaker } from "../hooks/useActiveSpeaker";
import { useMeetingEvents } from "../hooks/useMeetingEvents";
import { useRecorder } from "../hooks/useRecorder";
import { useRoomShortcuts } from "../hooks/useRoomShortcuts";
import { useParticipantToasts } from "../hooks/useParticipantToasts";

import RoomHeader from "../components/room/RoomHeader";
import VideoGrid from "../components/room/VideoGrid";
import ControlBar from "../components/room/ControlBar";
import ParticipantsPanel from "../components/room/ParticipantsPanel";
import LeaveConfirmModal from "../components/room/LeaveConfirmModal";
import ChatPanel from "../components/room/ChatPanel";
import meetingService from "../services/meeting.Service";
import ScreenShareView from "../components/room/ScreenShareView";
import { supportsScreenShare } from "../utils/platform";

import { isSoundEnabled, setSoundEnabled } from "../lib/sound";

export default function MeetingRoom() {
	const { meetingId } = useParams();
	const navigate = useNavigate();

	const leavingRef = useRef(false);
	const joinedOnceRef = useRef(false);

	const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled());

	const screenShareAvailable = supportsScreenShare();

	// const { unreadChatCount } = useMeeting();

	const {
		meeting,
		myParticipant,
		participants,
		status,
		isMuted,
		isCameraOff,
		isScreenSharing,
		joinById,
		leave,
		toggleMute,
		toggleCamera,
		toggleScreenShare,
		peerConnections,
		localStreamRef: contextLocalStreamRef,
		hostMute,
		hostUnmute,
		hostRemove,
		hostPromote,
		hostDemote,
		hostStopShare,
		hostEndForAll,
		remoteIsRecording,
		broadcastRecordingStart,
		broadcastRecordingStop,
		unreadChatCount,
	} = useMeeting();

	const localStreamRef = useRef(null);
	const screenStreamRef = useRef(null);
	const [localScreenStream, setLocalScreenStream] = useState(null);

	const [localStream, setLocalStream] = useState(null);

	const [remoteStreams, setRemoteStreams] = useState(new Map());
	const [bootstrapping, setBootstrapping] = useState(true);

	const [showChat, setShowChat] = useState(false);
	const [showPeople, setShowPeople] = useState(false);
	const [showLeaveModal, setShowLeaveModal] = useState(false);

	const isHost =
		myParticipant?.role === "HOST" || myParticipant?.role === "COHOST";

	// Custom hooks (must all be unconditional)
	useParticipantToasts(participants, !bootstrapping);

	const toggleSound = useCallback(() => {
		const next = !soundEnabled;
		setSoundEnabled(next);
		setSoundEnabledState(next);
		toast(next ? "Notification sounds on" : "Notification sounds off", {
			icon: next ? "🔔" : "🔕",
		});
	}, [soundEnabled]);

	// Ensure we're joined
	useEffect(() => {
		if (leavingRef.current) return;
		if (joinedOnceRef.current) return;

		let cancelled = false;

		const ensureJoined = async () => {
			if (meeting?._id === meetingId && status === "JOINED") {
				setBootstrapping(false);
				return;
			}
			try {
				await joinById({ meetingId });
				joinedOnceRef.current = true;
				if (!cancelled) setBootstrapping(false);
			} catch (err) {
				if (cancelled) return;
				toast.error(err.message || "Failed to rejoin meeting");
				navigate("/home", { replace: true });
			}
		};

		ensureJoined();
		return () => {
			cancelled = true;
		};
	}, [meetingId]);

	// Local media
	const handleStreamReady = useCallback(
		(stream) => {
			localStreamRef.current = stream;
			setLocalStream(stream);
			if (contextLocalStreamRef) contextLocalStreamRef.current = stream;
		},
		[contextLocalStreamRef],
	);

	useMediaDevices({
		onStreamReady: handleStreamReady,
	});

	// WebRTC
	const { callPeer, retryPending } = useWebRTC({
		localStreamRef,
		screenStreamRef,
		peerConnections,
		onRemoteStream: (socketId, stream) => {
			setRemoteStreams((prev) => new Map(prev).set(socketId, stream));
		},
		onRemoteStreamRemoved: (socketId) => {
			setRemoteStreams((prev) => {
				const next = new Map(prev);
				next.delete(socketId);
				return next;
			});
		},
		getParticipantMeta: (socketId) =>
			participants.find((p) => p.socketId === socketId),
	});

	useMeetingEvents();

	// Active speaker detection — now receives the state-backed stream
	const activeSpeaker = useActiveSpeaker({
		localStream,
		remoteStreams,
	});

	// Who's currently sharing?
	const remoteSharer = participants.find((p) => p.isScreenSharing);

	const activeSharer = isScreenSharing
		? {
				isSelf: true,
				socketId: "self",
				name: myParticipant?.name || "You",
				username: myParticipant?.username,
				profileImage: myParticipant?.profileImage,
				role: myParticipant?.role,
			}
		: remoteSharer
			? {
					isSelf: false,
					socketId: remoteSharer.socketId,
					name: remoteSharer.name,
					username: remoteSharer.username,
					profileImage: remoteSharer.profileImage,
					role: remoteSharer.role,
				}
			: null;

	// The stream to render for the sharer
	const sharerStream = activeSharer
		? activeSharer.isSelf
			? localScreenStream
			: remoteStreams.get(activeSharer.socketId) || null
		: null;

	/* Can I start sharing?
	 Blocked if a remote participant is sharing (self doesn't count). */
	const someoneElseSharing = !!remoteSharer && !isScreenSharing;
	const canShare = !someoneElseSharing;
	const sharerName = remoteSharer?.name;

	// Media sync
	const { applyMediaState, syncScreenShare } = useMediaSync({
		localStreamRef,
		screenStreamRef,
		peerConnections,
		onScreenShareEnded: () => {
			if (isScreenSharing) toggleScreenShare();
		},
	});

	useEffect(() => {
		applyMediaState(isMuted, isCameraOff);
	}, [isMuted, isCameraOff, applyMediaState]);

	useEffect(() => {
		syncScreenShare(isScreenSharing);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isScreenSharing]);

	// Leave handlers
	const confirmLeave = useCallback(async () => {
		leavingRef.current = true;
		setShowLeaveModal(false);
		try {
			await leave();
			// navigate('/meet');
		} catch (err) {
			toast.error(err.message || "Failed to leave");
		}
	}, [leave]);

	const confirmEndForAll = useCallback(async () => {
		setShowLeaveModal(false);
		try {
			await hostEndForAll();
		} catch (err) {
			toast.error(err.message || "Failed to end meeting");
		}
	}, [hostEndForAll]);

	// Recorder — records the LOCAL stream
	/* const {
		isRecording,
		start: startRecording,
		stop: stopRecording,
	} = useRecorder({ streamRef: localStreamRef });

	// Recording toggle (host only)
	const handleToggleRecording = useCallback(async () => {
		if (!isHost) return;

		if (!isRecording) {
			const ok = startRecording();
			if (ok) {
				broadcastRecordingStart();
				try {
					await meetingService.setRecording(meetingId, true);
				} catch (err) {
					console.error("Failed to persist recording flag:", err);
				}
			}
		} else {
			stopRecording();
			broadcastRecordingStop();
			try {
				await meetingService.setRecording(meetingId, false);
			} catch (err) {
				console.error("Failed to persist recording flag:", err);
			}
		}
	}, [
		isHost,
		isRecording,
		startRecording,
		stopRecording,
		broadcastRecordingStart,
		broadcastRecordingStop,
		meetingId,
	]); */

	// Recording is not yet supported — button just shows a toast
	const isRecording = false;

	const handleToggleRecording = useCallback(() => {
		toast("Recording feature is coming soon...", { icon: "🎬" });
	}, []);

	useRoomShortcuts({
		onToggleMute: toggleMute,
		onToggleCamera: toggleCamera,
		// onToggleScreenShare: canShare
		// 	? toggleScreenShare
		// 	: () => {
		// 			toast.error(`${sharerName || "Someone"} is already sharing`);
		// 		},
		onToggleScreenShare: () => {
			if (!screenShareAvailable) {
				toast.error("Screen sharing is only available on desktop");
				return;
			}
			if (!canShare) {
				toast.error(`${sharerName || "Someone"} is already sharing`);
				return;
			}
			toggleScreenShare();
		},
		onToggleChat: () => {
			setShowChat((v) => !v);
			if (!showChat) setShowPeople(false);
		},
		onTogglePeople: () => {
			setShowPeople((v) => !v);
			if (!showPeople) setShowChat(false);
		},
		onLeave: () => setShowLeaveModal(true),
		onToggleRecording: handleToggleRecording,
	});

	// Auto-stop recording when leaving
	useEffect(() => {
		return () => {
			if (isRecording) {
				try {
					stopRecording();
				} catch {}
			}
		};
	}, []);

	// Sync local screen stream ref to state so we can render it
	useEffect(() => {
		if (isScreenSharing) {
			// Wait for useMediaSync to populate the ref
			const id = setInterval(() => {
				if (screenStreamRef.current) {
					setLocalScreenStream(screenStreamRef.current);
					clearInterval(id);
				}
			}, 100);
			return () => clearInterval(id);
		} else {
			setLocalScreenStream(null);
		}
	}, [isScreenSharing]);

	useEffect(() => {
		if (localStream) {
			retryPending();
		}
	}, [localStream, retryPending]);

	// Render
	if (bootstrapping || !meeting) {
		return (
			<div className="flex h-screen-dynamic flex-col items-center justify-center gap-3 bg-gray-950">
				<Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
				<p className="text-sm text-gray-400">Entering meeting...</p>
			</div>
		);
	}

	return (
		<div className="flex h-screen-dynamic flex-col bg-gray-950">
			<RoomHeader
				meeting={meeting}
				participantCount={participants.length + 1}
				startedAt={meeting.startedAt || meeting.scheduledAt}
				isAnyoneRecording={isRecording || remoteIsRecording}
				recordingBy={isRecording ? "you" : remoteIsRecording ? "host" : null}
			/>

			<main className="flex flex-1 overflow-hidden">
				{/* Video area */}
				<div className="flex-1 overflow-hidden">
					{activeSharer ? (
						<ScreenShareView
							sharer={activeSharer}
							sharerStream={sharerStream}
							localStream={localStream}
							myParticipant={{
								...myParticipant,
								name: "You",
								isMuted,
								isCameraOff,
								isScreenSharing,
							}}
							remoteStreams={remoteStreams}
							participants={participants}
							activeSpeaker={activeSpeaker}
						/>
					) : (
						<VideoGrid
							localStream={localStream}
							myParticipant={{
								...myParticipant,
								name: "You",
								isMuted,
								isCameraOff,
								isScreenSharing,
							}}
							remoteStreams={remoteStreams}
							participants={participants}
							activeSpeaker={activeSpeaker}
						/>
					)}
				</div>

				{/* Right panel — desktop rail OR mobile overlay */}
				{(showPeople || showChat) && (
					<>
						{/* Mobile backdrop (only shows < lg) */}
						<div
							onClick={() => {
								setShowChat(false);
								setShowPeople(false);
							}}
							className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
						/>

						{/* Panel container */}
						<aside
							className="
					fixed inset-x-0 bottom-0 top-14 z-40
					w-full border-t border-white/5 bg-gray-900/95 backdrop-blur
					lg:static lg:inset-auto lg:z-0 lg:w-80 lg:border-l lg:border-t-0
				"
						>
							{/* Close button for mobile */}
							<div className="flex items-center justify-end px-3 pt-2 lg:hidden">
								<button
									onClick={() => {
										setShowChat(false);
										setShowPeople(false);
									}}
									className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							{showPeople ? (
								<ParticipantsPanel
									participants={participants}
									myParticipant={myParticipant}
									meeting={meeting}
									isHost={isHost}
									onMute={hostMute}
									onUnmute={hostUnmute}
									onRemove={hostRemove}
									onPromote={hostPromote}
									onDemote={hostDemote}
									onStopShare={hostStopShare}
								/>
							) : (
								<ChatPanel meetingId={meetingId} />
							)}
						</aside>
					</>
				)}
			</main>

			<ControlBar
				isMuted={isMuted}
				isCameraOff={isCameraOff}
				isScreenSharing={isScreenSharing}
				showChat={showChat}
				showPeople={showPeople}
				isHost={myParticipant?.role === "HOST"}
				isRecording={isRecording}
				onToggleRecording={handleToggleRecording}
				onToggleMute={toggleMute}
				unreadChatCount={unreadChatCount}
				onToggleCamera={toggleCamera}
				// onToggleScreenShare={toggleScreenShare}
				onToggleScreenShare={() => {
					if (!screenShareAvailable) {
						toast.error("Screen sharing is only available on desktop");
						return;
					}
					toggleScreenShare();
				}}
				canShare={canShare}
				sharerName={sharerName}
				onToggleChat={() => {
					setShowChat((v) => !v);
					if (!showChat) setShowPeople(false);
				}}
				onTogglePeople={() => {
					setShowPeople((v) => !v);
					if (!showPeople) setShowChat(false);
				}}
				onLeave={() => setShowLeaveModal(true)}
			/>

			<LeaveConfirmModal
				open={showLeaveModal}
				onClose={() => setShowLeaveModal(false)}
				onLeave={confirmLeave}
				onEndForAll={confirmEndForAll}
				isHost={myParticipant?.role === "HOST"}
				participantCount={participants.length + 1}
			/>
		</div>
	);
}
