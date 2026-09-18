import React, { useState, useRef, useEffect } from "react";
import {
	Mic,
	MicOff,
	Video,
	VideoOff,
	MonitorUp,
	Crown,
	Shield,
	MoreVertical,
	UserX,
	UserCheck,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * @param {Object} props
 * @param {Array} props.participants  — from MeetingContext (includes self via ack)
 * @param {Object} props.myParticipant
 * @param {Object} props.meeting
 * @param {boolean} props.isHost
 * @param {Function} props.onMute       — (participantId, socketId) => void
 * @param {Function} props.onUnmute     — (participantId) => void
 * @param {Function} props.onRemove     — (participantId, socketId) => void
 * @param {Function} props.onPromote    — (participantId) => void
 * @param {Function} props.onDemote     — (participantId) => void
 */
export default function ParticipantsPanel({
	participants,
	myParticipant,
	meeting,
	isHost,
	onMute,
	onUnmute,
	onRemove,
	onPromote,
	onDemote,
}) {
	const { user } = useAuth();

	// Build a combined list: self + remote participants
	const allParticipants = [
		{
			_id: myParticipant?._id,
			socketId: "self",
			isSelf: true,
			participantId: myParticipant?._id,
			user: { name: user?.name, username: user?.username, profileImage: user?.profileImage },
			role: myParticipant?.role,
			isMuted: myParticipant?.isMuted,
			isCameraOff: myParticipant?.isCameraOff,
			isScreenSharing: myParticipant?.isScreenSharing,
		},
		...participants.map((p) => ({
			_id: p.userId,
			socketId: p.socketId,
			isSelf: false,
			participantId: p.participantId,
			user: {
				name: p.name,
				username: p.username,
				profileImage: p.profileImage,
			},
			role: p.role,
			isMuted: p.isMuted,
			isCameraOff: p.isCameraOff,
			isScreenSharing: p.isScreenSharing,
		})),
	];

	// Sort: host first, then co-hosts, then participants (alphabetical)
	allParticipants.sort((a, b) => {
		const order = { HOST: 0, COHOST: 1, PARTICIPANT: 2 };
		if (order[a.role] !== order[b.role]) return order[a.role] - order[b.role];
		return (a.user?.name || "").localeCompare(b.user?.name || "");
	});

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
				<h3 className="text-sm font-semibold text-white">
					Participants ({allParticipants.length})
				</h3>
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto p-2">
				{allParticipants.map((p) => (
					<ParticipantRow
						key={p.socketId}
						participant={p}
						isHost={isHost}
						onMute={onMute}
						onUnmute={onUnmute}
						onRemove={onRemove}
						onPromote={onPromote}
						onDemote={onDemote}
					/>
				))}
			</div>
		</div>
	);
}

// Row component
function ParticipantRow({
	participant,
	isHost,
	onMute,
	onUnmute,
	onRemove,
	onPromote,
	onDemote,
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);

	// Close menu on outside click
	useEffect(() => {
		if (!menuOpen) return;
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	// Can we act on this participant?
	const canModerate = isHost && !participant.isSelf;
	const canKick =
		canModerate &&
		participant.role !== "HOST" && // can't kick host (only one host)
		(isHost ? true : participant.role !== "COHOST"); // host can't kick another cohost? Actually host CAN. Adjust below.

	const canPromote =
		canModerate && participant.role === "PARTICIPANT";
	const canDemote = canModerate && participant.role === "COHOST";

	const initials = (participant.user?.name || "U").charAt(0).toUpperCase();

	return (
		<div className="group relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5">
			{/* Avatar */}
			<div className="relative shrink-0">
				{participant.user?.profileImage ? (
					<img
						src={participant.user.profileImage}
						alt={participant.user.name}
						className="h-9 w-9 rounded-full object-cover"
					/>
				) : (
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-semibold text-white">
						{initials}
					</div>
				)}

				{/* Screen-share dot */}
				{participant.isScreenSharing && (
					<span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-gray-900">
						<MonitorUp className="h-2 w-2 text-white" />
					</span>
				)}
			</div>

			{/* Name + role badge */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<p className="truncate text-sm font-medium text-white">
						{participant.user?.name || "Guest"}
						{participant.isSelf && (
							<span className="ml-1 text-xs text-gray-400">(you)</span>
						)}
					</p>

					{participant.role === "HOST" && (
						<Crown className="h-3 w-3 shrink-0 text-amber-400" />
					)}
					{participant.role === "COHOST" && (
						<Shield className="h-3 w-3 shrink-0 text-indigo-400" />
					)}
				</div>
				<p className="truncate text-xs text-gray-400">
					@{participant.user?.username || "user"}
				</p>
			</div>

			{/* Status icons */}
			<div className="flex items-center gap-1">
				{participant.isMuted ? (
					<MicOff className="h-3.5 w-3.5 text-red-400" />
				) : (
					<Mic className="h-3.5 w-3.5 text-gray-500" />
				)}
				{participant.isCameraOff ? (
					<VideoOff className="h-3.5 w-3.5 text-red-400" />
				) : (
					<Video className="h-3.5 w-3.5 text-gray-500" />
				)}
			</div>

			{/* Host menu */}
			{canModerate && (
				<div ref={menuRef} className="relative">
					<button
						onClick={() => setMenuOpen((v) => !v)}
						className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100"
					>
						<MoreVertical className="h-4 w-4" />
					</button>

					{menuOpen && (
						<div className="absolute right-0 top-8 z-30 w-48 overflow-hidden rounded-lg border border-white/10 bg-gray-800 py-1 shadow-2xl">
							{/* Mute / unmute */}
							{participant.isMuted ? (
								<MenuItem
									icon={Mic}
									label="Ask to unmute"
									onClick={() => {
										onUnmute(participant.participantId);
										setMenuOpen(false);
									}}
								/>
							) : (
								<MenuItem
									icon={MicOff}
									label="Mute"
									onClick={() => {
										onMute(participant.participantId, participant.socketId);
										setMenuOpen(false);
									}}
								/>
							)}

							{/* Promote */}
							{canPromote && (
								<MenuItem
									icon={ChevronUp}
									label="Make co-host"
									onClick={() => {
										onPromote(participant.participantId);
										setMenuOpen(false);
									}}
								/>
							)}

							{/* Demote */}
							{canDemote && (
								<MenuItem
									icon={ChevronDown}
									label="Remove co-host"
									onClick={() => {
										onDemote(participant.participantId);
										setMenuOpen(false);
									}}
								/>
							)}

							{/* Remove */}
							{canKick && (
								<>
									<div className="my-1 h-px bg-white/10" />
									<MenuItem
										icon={UserX}
										label="Remove from meeting"
										variant="danger"
										onClick={() => {
											onRemove(participant.participantId, participant.socketId);
											setMenuOpen(false);
										}}
									/>
								</>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function MenuItem({ icon: Icon, label, onClick, variant }) {
	return (
		<button
			onClick={onClick}
			className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium transition-colors ${
				variant === "danger"
					? "text-red-400 hover:bg-red-500/10"
					: "text-gray-200 hover:bg-white/10"
			}`}
		>
			<Icon className="h-3.5 w-3.5" />
			{label}
		</button>
	);
}