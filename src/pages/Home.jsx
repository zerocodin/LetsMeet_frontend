import { useEffect, useState, useCallback } from "react";
import {
	Users,
	Bell,
	Sparkles,
	Calendar,
	TrendingUp,
	Video,
	Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../components/layout/AppLayout";
import CreateMeetingModal from "../components/meeting/CreateMeetingModal";
import userService from "../services/user.Service";
import activityService from "../services/activity.Service";
import ActivityFeed from "../components/home/ActivityFeed";

export default function Home() {
	const [showCreate, setShowCreate] = useState(false);
	const [initialMode, setInitialMode] = useState(undefined);
	const [activity, setActivity] = useState([]);
	const [activityLoading, setActivityLoading] = useState(true);

	const fetchActivity = useCallback(async () => {
		try {
			const res = await activityService.getFeed(15);
			setActivity(res.data || []);
		} catch (err) {
			console.error("Failed to load activity:", err);
		} finally {
			setActivityLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchActivity();
		const id = setInterval(fetchActivity, 60_000);
		return () => clearInterval(id);
	}, [fetchActivity]);

	const [statsData, setStatsData] = useState({
		friends: 0,
		meetings: 0,
		notifications: 0,
		events: 0,
	});
	const [statsLoading, setStatsLoading] = useState(true);

	const fetchStats = useCallback(async () => {
		try {
			const res = await userService.getStats();
			setStatsData(res.data || {});
		} catch (err) {
			// Silent — don't spam toasts on Home
			console.error("Failed to load stats:", err);
		} finally {
			setStatsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
		// Refresh every 60s so counts stay fresh
		const id = setInterval(fetchStats, 60_000);
		return () => clearInterval(id);
	}, [fetchStats]);

	// Config — map API keys to visual metadata
	const statConfig = [
		{
			key: "friends",
			label: "Friends",
			icon: Users,
			color: "from-blue-500 to-indigo-500",
		},
		{
			key: "meetings",
			label: "Meetings",
			icon: Video, // reuse Video icon
			color: "from-pink-500 to-rose-500",
		},
		{
			key: "notifications",
			label: "Unread",
			icon: Bell,
			color: "from-amber-500 to-orange-500",
		},
		{
			key: "events",
			label: "Events",
			icon: Calendar,
			color: "from-emerald-500 to-teal-500",
		},
	];

	const openCreate = (mode) => {
		setInitialMode(mode);
		setShowCreate(true);
	};

	const handleClick = ()=>{
		toast("coming soon...")
	}

	return (
		<AppLayout>
			{/* Greeting */}
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">Welcome back, 👋</h1>
					<p className="mt-1 text-sm text-gray-500">
						Here's what's happening in your world today.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => openCreate("now")}
						className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition-all hover:scale-[1.03]"
					>
						<Video className="h-4 w-4" />
						Instant Meeting
					</button>

					<button
						onClick={() => openCreate("schedule")}
						className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-700 backdrop-blur transition-all hover:bg-white"
					>
						<Plus className="h-4 w-4" />
						Schedule
					</button>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{statConfig.map(({ key, label, icon: Icon, color }) => {
					const value = statsData[key] ?? 0;

					return (
						<div
							key={key}
							className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md backdrop-blur-lg transition-transform hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div
								className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${color} text-white shadow-md`}
							>
								<Icon className="h-5 w-5" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium uppercase tracking-wide text-gray-400">
									{label}
								</p>
								{statsLoading ? (
									<div className="mt-1 h-7 w-12 animate-pulse rounded-md bg-gray-200" />
								) : (
									<p className="text-2xl font-bold text-gray-800">{value}</p>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Two-column area */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Feed */}
				<section className="lg:col-span-2">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold text-gray-800">Activity</h2>
						<span className="flex items-center gap-1 text-xs text-gray-500">
							<TrendingUp className="h-3.5 w-3.5" />
							Recent
						</span>
					</div>

					<ActivityFeed events={activity} loading={activityLoading} />
				</section>

				{/* Right column */}
				<aside className="space-y-6">
					{/* Quick tip card */}
					<div className="rounded-2xl border border-white/60 bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] p-5 text-white shadow-lg">
						<div className="mb-2 flex items-center gap-2">
							<Sparkles className="h-4 w-4" />
							<h3 className="text-sm font-semibold">Daily Tip</h3>
						</div>
						<p className="text-sm leading-relaxed text-white/90">
							Complete your profile to unlock more connections and personal
							recommendations.
						</p>
						<button className="mt-4 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/30" onClick={handleClick}>
							Complete profile
						</button>
					</div>
				</aside>
			</div>

			<CreateMeetingModal
				open={showCreate}
				onClose={() => {
					setShowCreate(false);
					setInitialMode(undefined);
				}}
				initialMode={initialMode}
			/>
		</AppLayout>
	);
}
