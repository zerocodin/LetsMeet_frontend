import React, { useEffect, useRef } from "react";
import { MicOff, MonitorUp, Crown, Shield } from "lucide-react";

/**
 * @param {MediaStream|null} stream
 * @param {Object} participant    — { name, username, profileImage, isMuted, isCameraOff, isScreenSharing, role }
 * @param {boolean} isLocal
 * @param {boolean} isScreenShare
 */
export default function VideoTile({
	stream,
	participant,
	isLocal = false,
	isScreenShare = false,
	isSpeaking = false,
}) {
	const videoRef = useRef(null);

	// Attach stream
	useEffect(() => {
		const el = videoRef.current;
		if (!el) return;

		if (stream) {
			el.srcObject = stream;
			// Autoplay sometimes needs a kick after attaching
			el.play().catch(() => {});
		} else {
			el.srcObject = null;
		}
	}, [stream]);

	const initials = (participant?.name || participant?.username || "U")
		.charAt(0)
		.toUpperCase();

	const roleBadge =
		participant?.role === "HOST" ? (
			<Crown className="h-3 w-3 text-amber-400" />
		) : participant?.role === "COHOST" ? (
			<Shield className="h-3 w-3 text-indigo-400" />
		) : null;

	return (
		<div
			className={`group relative overflow-hidden rounded-xl bg-gray-900 shadow-md ring-1 transition-all ${
				isSpeaking
					? "ring-2 ring-emerald-400 shadow-emerald-500/20"
					: "ring-white/5"
			} ${isScreenShare ? "col-span-2 row-span-2" : ""}`}
		>
			{/* Video element (kept mounted so stream survives camera-off) */}
			<video
				ref={videoRef}
				autoPlay
				playsInline
				muted={isLocal}
				className={`h-full w-full object-cover transition-opacity ${
					participant?.isCameraOff && !isScreenShare
						? "opacity-0"
						: "opacity-100"
				}`}
			/>

			{/* Avatar fallback (camera off) */}
			{participant?.isCameraOff && !isScreenShare && (
				<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
					{participant?.profileImage ? (
						<img
							src={participant.profileImage}
							alt={participant.name}
							className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10"
						/>
					) : (
						<div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-2xl font-bold text-white ring-4 ring-white/10">
							{initials}
						</div>
					)}
				</div>
			)}

			{/* Name + badges (bottom-left) */}
			<div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/50 px-2 py-1 backdrop-blur">
				{roleBadge}
				<span className="max-w-30 truncate text-xs font-medium text-white">
					{isLocal ? "You" : participant?.name || "Guest"}
				</span>
				{participant?.isMuted && <MicOff className="h-3 w-3 text-red-400" />}
			</div>

			{/* Screen-share badge (top-left) */}
			{isScreenShare && (
				<div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
					<MonitorUp className="h-3 w-3" />
					Presenting
				</div>
			)}

			{/* Speaking indicator (subtle ring) — placeholder for now */}
			{participant?.isSpeaking && (
				<div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-400/70" />
			)}
		</div>
	);
}
