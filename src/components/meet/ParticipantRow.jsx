import React from "react";
import { Crown, Shield, Clock, LogOut, LogIn } from "lucide-react";
import { formatDuration, formatTime, liveDuration } from "../../utils/formatDuration";

/**
 * @param {Object} props
 * @param {Object} props.participant  — the raw participant record with populated user
 * @param {"active"|"history"} props.variant
 */
export default function ParticipantRow({ participant, variant = "active" }) {
	const user = participant.user || {};
	const initials = (user.name || "U").charAt(0).toUpperCase();

	const durationSeconds = liveDuration(participant.joinedAt, participant.leftAt);

	return (
		<li className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5">
			{/* Avatar */}
			<div className="relative shrink-0">
				{user.profileImage ? (
					<img
						src={user.profileImage}
						alt={user.name}
						className="h-9 w-9 rounded-full object-cover"
					/>
				) : (
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-semibold text-white">
						{initials}
					</div>
				)}
				{variant === "active" && (
					<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
				)}
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<p className="truncate text-sm font-medium text-gray-800">
						{user.name || "Guest"}
					</p>
					{participant.role === "HOST" && (
						<Crown className="h-3 w-3 shrink-0 text-amber-500" />
					)}
					{participant.role === "COHOST" && (
						<Shield className="h-3 w-3 shrink-0 text-indigo-500" />
					)}
				</div>

				{user.username && (
					<p className="truncate text-xs text-gray-500">@{user.username}</p>
				)}

				{/* Timing info */}
				{variant === "active" ? (
					<p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
						<LogIn className="h-3 w-3" />
						Joined {formatTime(participant.joinedAt)} ·{" "}
						{formatDuration(durationSeconds)} in meeting
					</p>
				) : (
					<div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
						<p className="flex items-center gap-1">
							<LogIn className="h-3 w-3 text-emerald-500" />
							{formatTime(participant.joinedAt)}
							{participant.leftAt && (
								<>
									<span className="mx-1 text-gray-300">→</span>
									<LogOut className="h-3 w-3 text-red-400" />
									{formatTime(participant.leftAt)}
								</>
							)}
						</p>
						<p className="flex items-center gap-1 text-gray-400">
							<Clock className="h-3 w-3" />
							Stayed {formatDuration(durationSeconds)}
						</p>
					</div>
				)}
			</div>
		</li>
	);
}