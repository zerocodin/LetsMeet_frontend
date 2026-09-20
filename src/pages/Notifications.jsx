import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Bell,
	CheckCheck,
	Trash2,
	Loader2,
	UserPlus,
	UserCheck,
	UserX,
	Video,
	Clock,
	AlertCircle,
	Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../components/layout/AppLayout";
import { useNotifications } from "../context/NotificationContext";

const FILTERS = [
	{ key: "all", label: "All" },
	{ key: "unread", label: "Unread" },
];

const TYPE_CONFIG = {
	FRIEND_REQUEST: { icon: UserPlus, color: "bg-indigo-100 text-indigo-600" },
	FRIEND_ACCEPTED: { icon: UserCheck, color: "bg-emerald-100 text-emerald-600" },
	FRIEND_REJECTED: { icon: UserX, color: "bg-red-100 text-red-600" },
	MEETING_INVITE: { icon: Video, color: "bg-purple-100 text-purple-600" },
	MEETING_STARTING: { icon: Clock, color: "bg-amber-100 text-amber-600" },
	MEETING_ENDED: { icon: Video, color: "bg-gray-100 text-gray-600" },
	MEETING_CANCELLED: { icon: AlertCircle, color: "bg-red-100 text-red-600" },
	SYSTEM: { icon: Bell, color: "bg-blue-100 text-blue-600" },
};

export default function Notifications() {
	const navigate = useNavigate();
	const {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
		removeNotification,
		clearRead,
		loadNotifications,
	} = useNotifications();

	const [filter, setFilter] = useState("all");

	// Refresh list when page mounts (in case context hasn't loaded yet)
	useEffect(() => {
		loadNotifications({ silent: true });
	}, [loadNotifications]);

	const filtered = useMemo(() => {
		if (filter === "unread") return notifications.filter((n) => !n.isRead);
		return notifications;
	}, [notifications, filter]);

	const handleClick = async (n) => {
		if (!n.isRead) await markAsRead(n._id);
		if (n.link) navigate(n.link);
	};

	const handleClearRead = async () => {
		if (!notifications.some((n) => n.isRead)) {
			toast("Nothing to clear", { icon: "ℹ️" });
			return;
		}
		await clearRead();
	};

	return (
		<AppLayout className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
						Notifications
						{unreadCount > 0 && (
							<span className="rounded-full bg-red-500 px-2 py-0.5 text-sm font-bold text-white">
								{unreadCount}
							</span>
						)}
					</h1>
					<p className="mt-1 text-sm text-gray-500">
						Stay on top of what's happening
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={markAllAsRead}
						disabled={unreadCount === 0}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
					>
						<CheckCheck className="h-3.5 w-3.5" />
						Mark all read
					</button>
					<button
						onClick={handleClearRead}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Clear read
					</button>
				</div>
			</div>

			{/* Filter tabs */}
			<div className="mb-5 flex flex-wrap gap-2">
				{FILTERS.map((f) => {
					const count =
						f.key === "unread" ? unreadCount : notifications.length;
					return (
						<button
							key={f.key}
							onClick={() => setFilter(f.key)}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								filter === f.key
									? "bg-[#3e4bc4] text-white shadow-sm"
									: "bg-white/60 text-gray-600 hover:bg-white"
							}`}
						>
							{f.label}
							<span
								className={`rounded-md px-1.5 py-0.5 text-[10px] ${
									filter === f.key
										? "bg-white/20 text-white"
										: "bg-gray-100 text-gray-500"
								}`}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			{/* Body */}
			{loading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-[#3e4bc4]" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState filter={filter} />
			) : (
				<ul className="space-y-2">
					{filtered.map((n) => (
						<NotificationRow
							key={n._id}
							notification={n}
							onClick={() => handleClick(n)}
							onDelete={() => removeNotification(n._id)}
						/>
					))}
				</ul>
			)}
		</AppLayout>
	);
}

//  Single row 
function NotificationRow({ notification: n, onClick, onDelete }) {
	const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
	const Icon = cfg.icon;

	const timeAgo = formatTimeAgo(n.createdAt);

	return (
		<li
			onClick={onClick}
			className={`group relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
				n.isRead
					? "border-white/60 bg-white/50"
					: "border-indigo-200/60 bg-white/80 shadow-sm"
			}`}
		>
			<div className="flex items-start gap-3">
				{/* Avatar or icon */}
				<div className="relative shrink-0">
					{n.from?.profileImage ? (
						<img
							src={n.from.profileImage}
							alt={n.from.name}
							className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
						/>
					) : (
						<div
							className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg.color}`}
						>
							<Icon className="h-5 w-5" />
						</div>
					)}

					{/* Unread dot */}
					{!n.isRead && (
						<span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
					)}
				</div>

				{/* Content */}
				<div className="min-w-0 flex-1">
					<div className="flex items-baseline gap-2">
						<h3
							className={`truncate text-sm ${
								n.isRead
									? "font-medium text-gray-700"
									: "font-bold text-gray-900"
							}`}
						>
							{n.title}
						</h3>
						<span className="shrink-0 text-xs text-gray-400">{timeAgo}</span>
					</div>

					{n.body && (
						<p className="mt-1 line-clamp-2 text-sm text-gray-600">
							{n.body}
						</p>
					)}

					{n.from && (
						<p className="mt-1 text-xs text-gray-500">
							From @{n.from.username || "user"}
						</p>
					)}
				</div>

				{/* Delete button (appears on hover) */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
					title="Delete"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
		</li>
	);
}

//  Empty state 
function EmptyState({ filter }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 py-20 text-center backdrop-blur">
			<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
				<Inbox className="h-6 w-6 text-[#3e4bc4]" />
			</div>
			<h3 className="text-base font-bold text-gray-800">
				{filter === "unread" ? "No unread notifications" : "No notifications yet"}
			</h3>
			<p className="mt-1 max-w-xs text-sm text-gray-500">
				{filter === "unread"
					? "You're all caught up."
					: "You'll see friend requests and meeting invites here."}
			</p>
		</div>
	);
}

//  Helpers 
function formatTimeAgo(iso) {
	if (!iso) return "";
	const diff = (Date.now() - new Date(iso).getTime()) / 1000;

	if (diff < 60) return "just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

	return new Date(iso).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}