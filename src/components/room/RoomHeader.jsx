import React, { useEffect, useState } from "react";
import { Copy, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";

/**
 * @param {Object} meeting
 * @param {number} participantCount
 * @param {Date|string} startedAt
 */
export default function RoomHeader({ meeting, participantCount, startedAt }) {
	const [elapsed, setElapsed] = useState("00:00");

	useEffect(() => {
		if (!startedAt) return;

		const start = new Date(startedAt).getTime();

		const tick = () => {
			const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
			const mm = String(Math.floor(diff / 60)).padStart(2, "0");
			const ss = String(diff % 60).padStart(2, "0");
			setElapsed(`${mm}:${ss}`);
		};

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [startedAt]);

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(meeting?.meetingLink || "");
			toast.success("Link copied");
		} catch {
			toast.error("Copy failed");
		}
	};

	return (
		<header className="flex h-14 items-center justify-between border-b border-white/5 bg-gray-900/80 px-4 backdrop-blur">
			{/* Left: title + code */}
			<div className="flex items-center gap-3">
				<div className="min-w-0">
					<h1 className="truncate text-sm font-bold text-white">
						{meeting?.title || "Meeting"}
					</h1>
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-gray-400">
							{meeting?.meetingCode}
						</span>
						<button
							onClick={copyLink}
							className="rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-white"
							title="Copy meeting link"
						>
							<Copy className="h-3 w-3" />
						</button>
					</div>
				</div>
			</div>

			{/* Right: timer + participant count */}
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
					<Clock className="h-3.5 w-3.5 text-emerald-400" />
					<span className="font-mono text-xs font-semibold text-white tabular-nums">
						{elapsed}
					</span>
				</div>

				<div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1">
					<Users className="h-3.5 w-3.5 text-indigo-400" />
					<span className="text-xs font-semibold text-white">
						{participantCount}
					</span>
				</div>
			</div>
		</header>
	);
}