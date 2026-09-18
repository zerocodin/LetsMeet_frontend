import React from "react";
import {
	Mic,
	MicOff,
	Video,
	VideoOff,
	MonitorUp,
	MonitorX,
	MessageSquare,
	Users,
	PhoneOff,
	XCircle,
	MoreVertical,
} from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.isMuted
 * @param {boolean} props.isCameraOff
 * @param {boolean} props.isScreenSharing
 * @param {boolean} props.isHost
 * @param {boolean} props.showChat
 * @param {boolean} props.showPeople
 * @param {Function} props.onToggleMute
 * @param {Function} props.onToggleCamera
 * @param {Function} props.onToggleScreenShare
 * @param {Function} props.onToggleChat
 * @param {Function} props.onTogglePeople
 * @param {Function} props.onLeave
 */
export default function ControlBar({
	isMuted,
	isCameraOff,
	isScreenSharing,
	isHost,
	showChat,
	showPeople,
	onToggleMute,
	onToggleCamera,
	onToggleScreenShare,
	onToggleChat,
	onTogglePeople,
	onLeave,
}) {
	return (
		<footer className="flex h-20 items-center justify-center border-t border-white/5 bg-gray-900/95 backdrop-blur">
			<div className="flex items-center gap-2 px-4">
				{/* Mic */}
				<ControlButton
					onClick={onToggleMute}
					active={!isMuted}
					icon={isMuted ? MicOff : Mic}
					label={isMuted ? "Unmute" : "Mute"}
					variant={isMuted ? "danger" : "neutral"}
				/>

				{/* Camera */}
				<ControlButton
					onClick={onToggleCamera}
					active={!isCameraOff}
					icon={isCameraOff ? VideoOff : Video}
					label={isCameraOff ? "Start video" : "Stop video"}
					variant={isCameraOff ? "danger" : "neutral"}
				/>

				{/* Screen share */}
				<ControlButton
					onClick={onToggleScreenShare}
					active={isScreenSharing}
					icon={isScreenSharing ? MonitorX : MonitorUp}
					label={isScreenSharing ? "Stop sharing" : "Share screen"}
					variant={isScreenSharing ? "success" : "neutral"}
				/>

				<div className="mx-1 h-8 w-px bg-white/10" />

				{/* Chat toggle */}
				<ControlButton
					onClick={onToggleChat}
					active={showChat}
					icon={MessageSquare}
					label="Chat"
					variant={showChat ? "primary" : "neutral"}
				/>

				{/* Participants toggle */}
				<ControlButton
					onClick={onTogglePeople}
					active={showPeople}
					icon={Users}
					label="People"
					variant={showPeople ? "primary" : "neutral"}
				/>

				<div className="mx-1 h-8 w-px bg-white/10" />

				{/* Leave / End */}
				<button
					onClick={onLeave}
					className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-all ${
						isHost
							? "bg-red-600 hover:bg-red-700"
							: "bg-red-500 hover:bg-red-600"
					}`}
				>
					{isHost ? (
						<>
							<XCircle className="h-4 w-4" />
							End
						</>
					) : (
						<>
							<PhoneOff className="h-4 w-4" />
							Leave
						</>
					)}
				</button>
			</div>
		</footer>
	);
}

/**
 * Reusable round button for the control bar.
 * variant: "neutral" | "primary" | "success" | "danger"
 */
function ControlButton({ onClick, icon: Icon, label, variant = "neutral", active }) {
	const variants = {
		neutral: active
			? "bg-white/10 text-white hover:bg-white/20"
			: "bg-white/5 text-gray-300 hover:bg-white/10",
		primary: "bg-indigo-500 text-white hover:bg-indigo-600",
		success: "bg-emerald-500 text-white hover:bg-emerald-600",
		danger: "bg-red-500/90 text-white hover:bg-red-600",
	};

	return (
		<button
			onClick={onClick}
			title={label}
			aria-label={label}
			className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${variants[variant]}`}
		>
			<Icon className="h-5 w-5" />
		</button>
	);
}