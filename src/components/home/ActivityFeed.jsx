import React from "react";
import { Link } from "react-router-dom";
import {
	Video,
	UserPlus,
	Users,
	Mail,
	Clock,
	AlertCircle,
	Bell,
	UserX,
	Loader2,
	Inbox,
} from "lucide-react";

const ICON_MAP = {
	video: { icon: Video, bg: "bg-purple-100", fg: "text-purple-600" },
	"user-plus": { icon: UserPlus, bg: "bg-indigo-100", fg: "text-indigo-600" },
	"user-x": { icon: UserX, bg: "bg-red-100", fg: "text-red-600" },
	users: { icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600" },
	mail: { icon: Mail, bg: "bg-amber-100", fg: "text-amber-600" },
	clock: { icon: Clock, bg: "bg-orange-100", fg: "text-orange-600" },
	alert: { icon: AlertCircle, bg: "bg-red-100", fg: "text-red-600" },
	bell: { icon: Bell, bg: "bg-blue-100", fg: "text-blue-600" },
};

/**
 * @param {Array}   events
 * @param {boolean} loading
 */
export default function ActivityFeed({ events = [], loading = false }) {
	if (loading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="h-5 w-5 animate-spin text-[#3e4bc4]" />
			</div>
		);
	}

	if (events.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 text-center backdrop-blur">
				<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
					<Inbox className="h-5 w-5 text-[#3e4bc4]" />
				</div>
				<h3 className="text-sm font-bold text-gray-800">Nothing yet</h3>
				<p className="mt-1 max-w-xs text-xs text-gray-500">
					Your meeting activity will show up here.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{events.map((ev) => (
				<ActivityRow key={ev.id} event={ev} />
			))}
		</div>
	);
}

function ActivityRow({ event }) {
	const cfg = ICON_MAP[event.icon] || ICON_MAP.bell;
	const Icon = cfg.icon;
	const timeAgo = formatTimeAgo(event.createdAt);
	const avatar = event.meta?.profileImage || event.meta?.from?.profileImage;

	let subtitle = event.subtitle;

if (
    (event.kind === "MEETING_INVITE" || event.kind === "MEETING_STARTING") &&
    event.meta?.scheduledAt
) {
    const when = new Date(event.meta.scheduledAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
    const inviter =
        event.meta?.from?.name || event.meta?.inviterName || "Someone";

    subtitle =
        event.kind === "MEETING_INVITE"
            ? `${inviter} invited you to a meeting on ${when}`
            : `Starts ${when}`;
}
	
	const inner = (
		<div className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
			{/* Avatar if available, else icon */}
			{avatar ? (
				<img
					src={avatar}
					alt=""
					className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
				/>
			) : (
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.fg}`}
				>
					<Icon className="h-5 w-5" />
				</div>
			)}

			{/* Body */}
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline justify-between gap-2">
					<p className="truncate text-sm font-semibold text-gray-800">
						{event.title}
					</p>
					<span className="shrink-0 text-xs text-gray-400">{timeAgo}</span>
				</div>
				{subtitle && (
					<p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);

	// Wrap in Link if there's a link
	if (event.link) {
		return (
			<Link to={event.link} className="block">
				{inner}
			</Link>
		);
	}

	return inner;
}

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
