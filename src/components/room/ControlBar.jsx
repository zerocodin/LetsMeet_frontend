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
	Circle,
	Square,
	Volume2,
	VolumeX,
} from "lucide-react";

export default function ControlBar({
	isMuted,
	isCameraOff,
	isScreenSharing,
	showChat,
	showPeople,
	onToggleMute,
	onToggleCamera,
	onToggleScreenShare,
	onToggleChat,
	onTogglePeople,
	onLeave,
	isHost,
	isRecording,
	onToggleRecording,
	unreadChatCount = 0,
	soundEnabled,
	onToggleSound,
	canShare = true,
	sharerName,
}) {
	return (
		<footer className="flex h-20 items-center justify-center border-t border-white/5 bg-gray-900/95 backdrop-blur">
			<div className="flex items-center gap-1.5 px-2 sm:gap-2 sm:px-4">
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
					onClick={canShare ? onToggleScreenShare : undefined}
					active={isScreenSharing}
					icon={isScreenSharing ? MonitorX : MonitorUp}
					label={
						!canShare
							? `${sharerName || "Someone"} is sharing`
							: isScreenSharing
								? "Stop sharing"
								: "Share screen"
					}
					variant={
						!canShare ? "disabled" : isScreenSharing ? "success" : "neutral"
					}
					disabled={!canShare && !isScreenSharing}
				/>

				{/* Record — host only */}
				{isHost && (
					<ControlButton
						onClick={onToggleRecording}
						active={isRecording}
						icon={isRecording ? Square : Circle}
						label={isRecording ? "Stop recording" : "Start recording"}
						variant={isRecording ? "danger" : "neutral"}
					/>
				)}

				<div className="mx-1 h-8 w-px bg-white/10" />

				{/* Chat toggle */}
				<div className="relative">
					<ControlButton
						onClick={onToggleChat}
						active={showChat}
						icon={MessageSquare}
						label="Chat"
						variant={showChat ? "primary" : "neutral"}
					/>
					{unreadChatCount > 0 && !showChat && (
						<span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-gray-900">
							{unreadChatCount > 9 ? "9+" : unreadChatCount}
						</span>
					)}
				</div>

				{/* Participants toggle */}
				<ControlButton
					onClick={onTogglePeople}
					active={showPeople}
					icon={Users}
					label="People"
					variant={showPeople ? "primary" : "neutral"}
				/>

				<ControlButton
					onClick={onToggleSound}
					active={soundEnabled}
					icon={soundEnabled ? Volume2 : VolumeX}
					label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
					variant={soundEnabled ? "neutral" : "neutral"}
				/>

				<div className="mx-1 h-8 w-px bg-white/10" />

				{/* Leave / End */}
				<button
					onClick={onLeave}
					className={`flex h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-white transition-all sm:h-12 sm:px-5 sm:text-sm ${
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
function ControlButton({
	onClick,
	icon: Icon,
	label,
	variant = "neutral",
	active,
	disabled = false,
}) {
	const variants = {
		neutral: active
			? "bg-white/10 text-white hover:bg-white/20"
			: "bg-white/5 text-gray-300 hover:bg-white/10",
		primary: "bg-indigo-500 text-white hover:bg-indigo-600",
		success: "bg-emerald-500 text-white hover:bg-emerald-600",
		danger: "bg-red-500/90 text-white hover:bg-red-600",
		disabled: "bg-white/5 text-gray-600 cursor-not-allowed",
	};

	return (
		<button
			onClick={disabled ? undefined : onClick}
			title={label}
			aria-label={label}
			disabled={disabled}
			className={`flex h-10 w-10 items-center justify-center rounded-full transition-all sm:h-12 sm:w-12 ${
				variants[variant] || variants.neutral
			}`}
		>
			<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
		</button>
	);
}
