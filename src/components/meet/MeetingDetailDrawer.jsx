import React, { useEffect, useState } from "react";
import {
	X,
	Calendar,
	Clock,
	Users,
	Crown,
	Shield,
	Copy,
	Loader2,
	UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import meetingService from "../../services/meeting.Service";
import StatusBadge from "./StatusBadge";
import InviteFriendsModal from "../meeting/InviteFriendsModal";
import { useAuth } from "../../context/AuthContext";

export default function MeetingDetailDrawer({ meeting, open, onClose }) {
	const { user } = useAuth();

	const [details, setDetails] = useState(null);
	const [loading, setLoading] = useState(false);

	const [participantTab, setParticipantTab] = useState("active"); // "active" | "history"

	const [history, setHistory] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [showInviteModal, setShowInviteModal] = useState(false);

	// Fetch meeting details when the drawer opens or invite modal closes
	useEffect(() => {
		if (!open || !meeting?._id) return;
		setLoading(true);
		meetingService
			.getMeetingById(meeting._id)
			.then((res) => setDetails(res.data))
			.catch((err) => toast.error(err.message || "Failed to load details"))
			.finally(() => setLoading(false));
	}, [open, meeting?._id, showInviteModal]);

	// Fetch participant history when the history tab is active
	useEffect(() => {
		if (!open || !meeting?._id) return;
		if (participantTab !== "history") return;

		setHistoryLoading(true);
		meetingService
			.getParticipantHistory(meeting._id)
			.then((res) => setHistory(res.data))
			.catch((err) => toast.error(err.message || "Failed to load history"))
			.finally(() => setHistoryLoading(false));
	}, [open, meeting?._id, participantTab]);

	if (!open) return null;

	const m = details?.meeting || meeting;
	const active = details?.activeParticipants || [];

	// Robust host check — string comparison of both ids
	const hostId =
		typeof details?.meeting?.host === "object"
			? details.meeting.host._id
			: (details?.meeting?.host ?? meeting?.host);

	const isHost = String(hostId) === String(user?._id);

	// Optional: log for debugging — remove after confirming
	console.log("[Drawer] host check:", {
		hostId: String(hostId),
		userId: String(user?._id),
		isHost,
		detailsLoaded: !!details,
	});

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Panel */}
			<aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-white/60 bg-white shadow-2xl">
				{/* Header */}
				<header className="flex items-start justify-between border-b border-gray-100 p-5">
					<div className="min-w-0">
						<h2 className="truncate text-lg font-bold text-gray-800">
							{m?.title}
						</h2>

						<div className="mt-1 flex items-center gap-2">
							<span className="font-mono text-xs text-gray-500">
								{m?.meetingCode}
							</span>

							{/* Copy code */}
							<button
								onClick={() => {
									navigator.clipboard.writeText(m?.meetingCode || "");
									toast.success("Code copied");
								}}
								className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
								title="Copy meeting code"
							>
								<Copy className="h-3 w-3" />
							</button>

							{/* Invite — host only, sibling button */}
							{/* {details?.meeting?.host?._id === user?._id && (
								<button
									onClick={() => setShowInviteModal(true)}
									className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
								>
									<UserPlus className="h-3.5 w-3.5" />
									Invite
								</button>
							)} */}

							{isHost && (
								<button
									onClick={() => setShowInviteModal(true)}
									className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02]"
								>
									<UserPlus className="h-3.5 w-3.5" />
									Invite
								</button>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-5">
					{loading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin text-[#3e4bc4]" />
						</div>
					) : (
						<>
							{/* Status */}
							<div className="mb-4">
								<StatusBadge status={m?.status} />
							</div>

							{/* Meta */}
							<div className="mb-5 grid grid-cols-2 gap-3">
								<MetaTile
									icon={Calendar}
									label="Scheduled"
									value={new Date(m?.scheduledAt).toLocaleString(undefined, {
										dateStyle: "medium",
										timeStyle: "short",
									})}
								/>
								<MetaTile
									icon={Clock}
									label="Duration"
									value={`${m?.duration} min`}
								/>
								<MetaTile
									icon={Users}
									label="Active now"
									value={active.length}
								/>
								<MetaTile icon={Users} label="Max" value={m?.maxParticipants} />
							</div>

							{/* Description */}
							{m?.description && (
								<section className="mb-5">
									<h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
										Description
									</h3>
									<p className="text-sm text-gray-700">{m.description}</p>
								</section>
							)}

							{/* Host */}
							<section className="mb-5">
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
									Host
								</h3>
								<div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-sm font-semibold text-white">
										{(m?.host?.name || "H").charAt(0).toUpperCase()}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-gray-800">
											{m?.host?.name || "Unknown"}
										</p>
										<p className="truncate text-xs text-gray-500">
											@{m?.host?.username || "user"}
										</p>
									</div>
									<Crown className="h-4 w-4 text-amber-500" />
								</div>
							</section>

							{/* Invited users */}
							{details?.meeting?.invitedUsers?.length > 0 && (
								<section className="mb-5">
									<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
										Invited ({details.meeting.invitedUsers.length})
									</h3>
									<ul className="space-y-2">
										{details.meeting.invitedUsers.map((u) => (
											<li
												key={u._id}
												className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5"
											>
												{u.profileImage ? (
													<img
														src={u.profileImage}
														alt={u.name}
														className="h-8 w-8 rounded-full object-cover"
													/>
												) : (
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-semibold text-white">
														{(u.name || "U").charAt(0).toUpperCase()}
													</div>
												)}
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-gray-800">
														{u.name}
													</p>
													<p className="truncate text-xs text-gray-500">
														@{u.username}
													</p>
												</div>
											</li>
										))}
									</ul>
								</section>
							)}

							{/* Active participants */}
							<section>
								<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
									Active participants ({active.length})
								</h3>

								{active.length === 0 ? (
									<div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
										No one is currently in this meeting
									</div>
								) : (
									<ul className="space-y-2">
										{active.map((p) => (
											<li
												key={p._id}
												className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5"
											>
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-xs font-semibold text-white">
													{(p.user?.name || "U").charAt(0).toUpperCase()}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-medium text-gray-800">
														{p.user?.name || "Guest"}
													</p>
													<p className="truncate text-xs text-gray-500">
														joined {new Date(p.joinedAt).toLocaleTimeString()}
													</p>
												</div>
												{p.role === "HOST" && (
													<Crown className="h-3.5 w-3.5 text-amber-500" />
												)}
												{p.role === "COHOST" && (
													<Shield className="h-3.5 w-3.5 text-indigo-500" />
												)}
											</li>
										))}
									</ul>
								)}
							</section>
						</>
					)}
				</div>

				<InviteFriendsModal
					open={showInviteModal}
					onClose={() => setShowInviteModal(false)}
					meetingId={meeting?._id}
					onInvited={() => {
						// Reload details to show the new invites
						meetingService
							.getMeetingById(meeting._id)
							.then((res) => setDetails(res.data));
					}}
				/>
			</aside>
		</>
	);
}

function MetaTile({ icon: Icon, label, value }) {
	return (
		<div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
			<div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
				<Icon className="h-3 w-3" />
				{label}
			</div>
			<p className="truncate text-sm font-semibold text-gray-800">{value}</p>
		</div>
	);
}
