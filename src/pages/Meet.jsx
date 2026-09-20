import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Plus, Video, CalendarX } from "lucide-react";
import toast from "react-hot-toast";

import AppLayout from "../components/layout/AppLayout";
import CreateMeetingModal from "../components/meeting/CreateMeetingModal";
import MeetingCard from "../components/meet/MeetingCard";
import MeetingDetailDrawer from "../components/meet/MeetingDetailDrawer";
import meetingService from "../services/meeting.Service";

const TABS = [
	{ key: "ALL", label: "All" },
	{ key: "SCHEDULED", label: "Scheduled" },
	{ key: "ONGOING", label: "Live" },
	{ key: "COMPLETED", label: "Completed" },
	{ key: "CANCELLED", label: "Cancelled" },
];

export default function Meet() {
	const navigate = useNavigate();
	const [roleTab, setRoleTab] = useState("host");

	const [meetings, setMeetings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState("ALL");
	const [search, setSearch] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [detailMeeting, setDetailMeeting] = useState(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [cancellingId, setCancellingId] = useState(null);

	// Fetch
	const fetchMeetings = useCallback(async () => {
		setLoading(true);
		try {
			// const res = await meetingService.getMyMeetings({ limit: 50 });
			const res = await meetingService.getMyMeetings({
				limit: 50,
				role: roleTab,
			});
			setMeetings(res.data || []);
		} catch (err) {
			toast.error(err.message || "Failed to load meetings");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMeetings();
	}, [fetchMeetings]);

	// Filter
	const filtered = useMemo(() => {
		let list = meetings;
		if (tab !== "ALL") list = list.filter((m) => m.status === tab);
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(m) =>
					m.title.toLowerCase().includes(q) ||
					m.meetingCode.toLowerCase().includes(q),
			);
		}
		return list;
	}, [meetings, tab, search]);

	// Actions
	const openDetail = (m) => {
		setDetailMeeting(m);
		setDetailOpen(true);
	};

	const handleCancel = async (m) => {
		const confirmed = window.confirm(
			`Cancel "${m.title}"? This cannot be undone.`,
		);
		if (!confirmed) return;

		setCancellingId(m._id);
		try {
			await meetingService.cancelMeeting(m._id);
			toast.success("Meeting cancelled");
			// Update locally
			setMeetings((prev) =>
				prev.map((x) => (x._id === m._id ? { ...x, status: "CANCELLED" } : x)),
			);
		} catch (err) {
			toast.error(err.message || "Failed to cancel");
		} finally {
			setCancellingId(null);
		}
	};

	// Counts for tabs
	const counts = useMemo(() => {
		const c = { ALL: meetings.length };
		TABS.slice(1).forEach((t) => {
			c[t.key] = meetings.filter((m) => m.status === t.key).length;
		});
		return c;
	}, [meetings]);

	return (
		<AppLayout className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">Meetings</h1>
					<p className="mt-1 text-sm text-gray-500">
						Manage all your meetings in one place
					</p>
				</div>

				<button
					onClick={() => setShowCreate(true)}
					className="inline-flex items-center gap-2 self-start rounded-xl bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-[1.03]"
				>
					<Plus className="h-4 w-4" />
					New meeting
				</button>
			</div>

			{/* Tabs + Search */}
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap gap-1.5">
					{TABS.map((t) => (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								tab === t.key
									? "bg-[#3e4bc4] text-white shadow-sm"
									: "bg-white/60 text-gray-600 hover:bg-white"
							}`}
						>
							{t.label}
							<span
								className={`rounded-md px-1.5 py-0.5 text-[10px] ${
									tab === t.key
										? "bg-white/20 text-white"
										: "bg-gray-100 text-gray-500"
								}`}
							>
								{counts[t.key] || 0}
							</span>
						</button>
					))}
				</div>

				<div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 backdrop-blur sm:w-64">
					<Search className="h-3.5 w-3.5 text-gray-400" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search title or code..."
						className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
					/>
				</div>
			</div>

			{/* Body */}
			{loading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-[#3e4bc4]" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState
					hasAny={meetings.length > 0}
					onCreate={() => setShowCreate(true)}
				/>
			) : (
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					{filtered.map((m) => (
						<MeetingCard
							key={m._id}
							meeting={m}
							onOpenDetail={openDetail}
							onCancel={handleCancel}
						/>
					))}
				</div>
			)}

			{/* Modals */}
			<CreateMeetingModal
				open={showCreate}
				onClose={() => {
					setShowCreate(false);
					fetchMeetings();
				}}
			/>

			<MeetingDetailDrawer
				meeting={detailMeeting}
				open={detailOpen}
				onClose={() => {
					setDetailOpen(false);
					setDetailMeeting(null);
				}}
			/>
		</AppLayout>
	);
}

function EmptyState({ hasAny, onCreate }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/50 py-20 text-center backdrop-blur">
			<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
				<CalendarX className="h-6 w-6 text-[#3e4bc4]" />
			</div>
			<h3 className="text-base font-bold text-gray-800">
				{hasAny ? "No meetings match your filter" : "No meetings yet"}
			</h3>
			<p className="mt-1 max-w-xs text-sm text-gray-500">
				{hasAny
					? "Try a different tab or clear your search."
					: "Create your first meeting and share the link with anyone."}
			</p>
			{!hasAny && (
				<button
					onClick={onCreate}
					className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.03]"
				>
					<Video className="h-4 w-4" />
					Create a meeting
				</button>
			)}
		</div>
	);
}
