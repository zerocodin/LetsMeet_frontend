import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useMeeting } from "../context/MeetingContext";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useWebRTC } from "../hooks/useWebRTC";
import { useMediaSync } from "../hooks/useMediaSync";
import { useActiveSpeaker } from "../hooks/useActiveSpeaker";
import { useMeetingEvents } from "../hooks/useMeetingEvents"; 

import RoomHeader from "../components/room/RoomHeader";
import VideoGrid from "../components/room/VideoGrid";
import ControlBar from "../components/room/ControlBar";
import ParticipantsPanel from "../components/room/ParticipantsPanel";   
import LeaveConfirmModal from "../components/room/LeaveConfirmModal";  
import ChatPanel from "../components/room/ChatPanel";

export default function MeetingRoom() {
	const { meetingId } = useParams();
	const navigate = useNavigate();

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
		hostEndForAll,
	} = useMeeting();

	const localStreamRef = useRef(null);
	const screenStreamRef = useRef(null);

	const [localStream, setLocalStream] = useState(null);

	const [remoteStreams, setRemoteStreams] = useState(new Map());
	const [bootstrapping, setBootstrapping] = useState(true);

	const [showChat, setShowChat] = useState(false);
	const [showPeople, setShowPeople] = useState(false);
	const [showLeaveModal, setShowLeaveModal] = useState(false);

	const isHost =
		myParticipant?.role === "HOST" || myParticipant?.role === "COHOST";

	// Ensure we're joined
	useEffect(() => {
		let cancelled = false;

		const ensureJoined = async () => {
			if (meeting?._id === meetingId && status === "JOINED") {
				setBootstrapping(false);
				return;
			}
			try {
				await joinById({ meetingId });
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
	}, [meetingId, meeting, status, joinById, navigate]);

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
		startCamera: !myParticipant?.isCameraOff,
		startMic: !myParticipant?.isMuted,
		onStreamReady: handleStreamReady,
	});

	// WebRTC
	useWebRTC({
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

	// Active speaker detection — now receives the state-backed stream
	const activeSpeaker = useActiveSpeaker({
		localStream,
		remoteStreams,
	});

	// Media sync
	const { applyMediaState, syncScreenShare } = useMediaSync({
		localStreamRef,
		screenStreamRef,
		peerConnections,
		onScreenShareEnded: () => {
			if (isScreenSharing) toggleScreenShare();
		},
	});

	useMeetingEvents();
	
	useEffect(() => {
		applyMediaState(isMuted, isCameraOff);
	}, [isMuted, isCameraOff, applyMediaState]);

	useEffect(() => {
		syncScreenShare(isScreenSharing);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isScreenSharing]);

	// Leave handlers
	const confirmLeave = useCallback(async () => {
		setShowLeaveModal(false);
		try {
			await leave();
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

	// Render
	if (bootstrapping || !meeting) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-950">
				<Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
				<p className="text-sm text-gray-400">Entering meeting...</p>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-gray-950">
			<RoomHeader
				meeting={meeting}
				participantCount={participants.length + 1}
				startedAt={meeting.startedAt || meeting.scheduledAt}
			/>

			<main className="flex flex-1 overflow-hidden">
				<div className="flex-1 overflow-hidden">
					<VideoGrid
						localStream={localStream}
						myParticipant={{ ...myParticipant, name: "You" }}
						remoteStreams={remoteStreams}
						participants={participants}
						activeSpeaker={activeSpeaker}
					/>
				</div>

				{showPeople && (
					<aside className="w-80 border-l border-white/5 bg-gray-900/60 backdrop-blur">
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
						/>
					</aside>
				)}

				{showChat && (
					<aside className="w-80 border-l border-white/5 bg-gray-900/60 backdrop-blur">
						<ChatPanel meetingId={meetingId} />
					</aside>
				)}
			</main>

			<ControlBar
				isMuted={isMuted}
				isCameraOff={isCameraOff}
				isScreenSharing={isScreenSharing}
				isHost={isHost}
				showChat={showChat}
				showPeople={showPeople}
				onToggleMute={toggleMute}
				onToggleCamera={toggleCamera}
				onToggleScreenShare={toggleScreenShare}
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