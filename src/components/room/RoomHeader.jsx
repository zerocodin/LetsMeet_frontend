import React, { useEffect, useState } from "react";
import { Copy, Clock, Users, Keyboard } from "lucide-react";
import toast from "react-hot-toast";

export default function RoomHeader({
	meeting,
	participantCount,
	startedAt,
	isAnyoneRecording = false,
	recordingBy = null,
}) {
	const [elapsed, setElapsed] = useState("00:00");
	const [showShortcuts, setShowShortcuts] = useState(false);

	// Meeting timer
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
		<>
			<header className="flex h-12 items-center justify-between border-b border-white/5 bg-gray-900/80 px-3 backdrop-blur sm:h-14 sm:px-4">
				{/* Left: title + code row */}
				<div className="min-w-0">
					<h1 className="truncate text-xs font-bold text-white sm:text-sm">
						{meeting?.title || "Meeting"}
					</h1>

					<div className="flex items-center gap-1.5">
						<span className="font-mono text-[10px] text-gray-400 sm:text-xs">
							{meeting?.meetingCode}
						</span>
						<button
							onClick={copyLink}
							className="rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-white"
							title="Copy meeting link"
						>
							<Copy className="h-3 w-3" />
						</button>
						<button
							onClick={() => setShowShortcuts(true)}
							className="rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-white"
							title="Keyboard shortcuts"
						>
							<Keyboard className="h-3 w-3" />
						</button>
					</div>
				</div>

				{/* Right: REC + timer + participants */}
				<div className="flex items-center gap-2 sm:gap-4">
					{isAnyoneRecording && (
						<div className="flex items-center gap-2 rounded-lg bg-red-500/20 px-2 py-1 sm:px-3">
							<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
							<span className="hidden text-xs font-semibold text-red-400 sm:inline">
								REC {recordingBy ? `· ${recordingBy}` : ""}
							</span>
							<span className="text-xs font-semibold text-red-400 sm:hidden">
								REC
							</span>
						</div>
					)}

					<div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 sm:px-2.5">
						<Clock className="h-3.5 w-3.5 text-emerald-400" />
						<span className="font-mono text-xs font-semibold text-white tabular-nums">
							{elapsed}
						</span>
					</div>

					<div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 sm:px-2.5">
						<Users className="h-3.5 w-3.5 text-indigo-400" />
						<span className="text-xs font-semibold text-white">
							{participantCount}
						</span>
					</div>
				</div>
			</header>

			{/* Shortcuts modal */}
			{showShortcuts && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setShowShortcuts(false)}
				>
					<div
						className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="mb-4 text-lg font-bold text-white">
							Keyboard shortcuts
						</h3>
						<ul className="space-y-2 text-sm text-gray-300">
							{[
								["M", "Toggle mute"],
								["V", "Toggle video"],
								["S", "Share screen"],
								["C", "Toggle chat"],
								["P", "Toggle people panel"],
								["R", "Toggle recording (host)"],
								["Esc", "Open leave dialog"],
							].map(([k, label]) => (
								<li key={k} className="flex items-center justify-between">
									<span>{label}</span>
									<kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white">
										{k}
									</kbd>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</>
	);
}