import React from "react";
import { useNavigate } from "react-router-dom";
import {
	Calendar,
	Clock,
	Users,
	Copy,
	Video,
	Trash2,
	MoreVertical,
	KeyRound,
	UserPlus
} from "lucide-react";
import toast from "react-hot-toast";
import StatusBadge from "./StatusBadge";

/**
 * @param {Object} props
 * @param {Object} props.meeting
 * @param {Function} props.onOpenDetail
 * @param {Function} props.onCancel
 */
export default function MeetingCard({ meeting, onOpenDetail, onCancel }) {
	const navigate = useNavigate();

	const copy = async (text, label = "Copied") => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(label);
		} catch {
			toast.error("Copy failed");
		}
	};

	const canJoin =
		meeting.status === "SCHEDULED" || meeting.status === "ONGOING";
	const canCancel =
		meeting.status === "SCHEDULED" || meeting.status === "ONGOING";

	const handleJoin = () => {
		if (meeting.status === "ONGOING") {
			navigate(`/room/${meeting._id}`);
		} else {
			navigate(`/meeting/${meeting.meetingCode}`);
		}
	};

	const dateLabel = new Date(meeting.scheduledAt).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});

	return (
		<div className="group rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg transition-all hover:-translate-y-0.5 hover:shadow-lg">
			{/* Header */}
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-base font-bold text-gray-800">
						{meeting.title}
					</h3>
					<div className="mt-1 flex items-center gap-2">
						<span className="font-mono text-xs text-gray-500">
							{meeting.meetingCode}
						</span>
						<button
							onClick={() => copy(meeting.meetingCode, "Code copied")}
							className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						>
							<KeyRound className="h-3 w-3" />
						</button>
					</div>
				</div>
				<StatusBadge status={meeting.status} />
			</div>

			{/* Meta rows */}
			<div className="mb-4 space-y-2 text-xs text-gray-600">
				<div className="flex items-center gap-2">
					<Calendar className="h-3.5 w-3.5 text-gray-400" />
					<span>{dateLabel}</span>
				</div>

				<div className="flex items-center gap-2">
					<Clock className="h-3.5 w-3.5 text-gray-400" />
					<span>{meeting.duration} min</span>
				</div>

				<div className="flex items-center gap-2">
					<Users className="h-3.5 w-3.5 text-gray-400" />
					<span>
						{meeting.activeParticipants || 0} active ·{" "}
						{meeting.totalParticipants || 0} total
					</span>
				</div>

				{meeting.invitedUsers?.length > 0 && (
					<div className="flex items-center gap-2">
						<UserPlus className="h-3.5 w-3.5 text-gray-400" />
						<span>{meeting.invitedUsers.length} invited</span>
					</div>
				)}

			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				{canJoin && (
					<button
						onClick={handleJoin}
						className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
					>
						<Video className="h-3.5 w-3.5" />
						{meeting.status === "ONGOING" ? "Join now" : "Start"}
					</button>
				)}

				<button
					onClick={() => copy(meeting.meetingLink, "Link copied")}
					className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					<Copy className="h-3.5 w-3.5" />
					Copy link
				</button>

				<button
					onClick={() => onOpenDetail(meeting)}
					className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					Details
				</button>

				{canCancel && (
					<button
						onClick={() => onCancel(meeting)}
						className="ml-auto inline-flex items-center gap-1.5 rounded-lg p-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
						title="Cancel meeting"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}
