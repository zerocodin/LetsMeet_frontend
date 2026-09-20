import React, { useEffect, useState, useRef } from "react";
import { Clock, Loader2, Video, ArrowLeft, Play } from "lucide-react";

/**
 * @param {Object} meeting  — { title, meetingCode, scheduledAt, host }
 * @param {number} startsIn — seconds until start
 * @param {Function} onRetry   — called when timer hits 0 (or on poll)
 * @param {Function} onBack
 * @param {boolean} retrying   — true while the parent is re-attempting join
 */
export default function WaitingRoom({
	meeting,
	startsIn,
	onRetry,
	onBack,
	retrying,
	isHost = false,
	onStartNow,
}) {
	const [secondsLeft, setSecondsLeft] = useState(startsIn);
	const [starting, setStarting] = useState(false);
	const retriedRef = useRef(false);

	// Tick down every second
	useEffect(() => {
		if (secondsLeft <= 0) return;
		const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
		return () => clearTimeout(t);
	}, [secondsLeft]);

	// Auto-retry once timer hits 0
	useEffect(() => {
		if (secondsLeft === 0 && !retriedRef.current) {
			retriedRef.current = true;
			onRetry?.();
		}
	}, [secondsLeft, onRetry]);

	// If timer is already 0 (e.g. user refreshed after start time)
	useEffect(() => {
		if (startsIn <= 0 && !retriedRef.current) {
			retriedRef.current = true;
			onRetry?.();
		}
	}, [startsIn, onRetry]);

	const handleStartNow = async () => {
		setStarting(true);
		try {
			await onStartNow?.();
		} finally {
			setStarting(false);
		}
	};

	const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
	const ss = String(secondsLeft % 60).padStart(2, "0");

	const scheduledLabel = meeting?.scheduledAt
		? new Date(meeting.scheduledAt).toLocaleString(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			})
		: "";

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
			<div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
				{/* Header */}
				<div className="mb-6 flex flex-col items-center text-center">
					<div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white shadow-lg">
						<Video className="h-6 w-6" />
					</div>
					<h2 className="text-lg font-bold text-gray-800">
						{meeting?.title || "Meeting"}
					</h2>
					<p className="mt-1 text-xs text-gray-500">
						Code: <span className="font-mono">{meeting?.meetingCode}</span>
					</p>
				</div>

				{/* Timer */}
				<div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-center">
					<div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
						<Clock className="h-3.5 w-3.5" />
						{secondsLeft > 0 ? "Starts in" : "Starting..."}
					</div>

					{secondsLeft > 0 ? (
						<p className="text-4xl font-extrabold tracking-tight text-[#3e4bc4] tabular-nums">
							{mm}:{ss}
						</p>
					) : (
						<div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#3e4bc4]">
							<Loader2 className="h-4 w-4 animate-spin" />
							Joining your meeting...
						</div>
					)}

					{scheduledLabel && (
						<p className="mt-2 text-xs text-gray-500">
							Scheduled for {scheduledLabel}
						</p>
					)}
				</div>

				{/* Host start now panel */}
				{isHost && secondsLeft > 0 && (
					<div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
						<p className="text-xs font-semibold text-emerald-700">
							You're the host
						</p>
						<p className="mt-1 text-xs text-emerald-600">
							Start the meeting now — everyone waiting will be let in.
						</p>
						<button
							type="button"
							onClick={handleStartNow}
							disabled={starting || retrying}
							className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-60"
						>
							{starting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Starting...
								</>
							) : (
								<>
									<Play className="h-4 w-4" />
									Start meeting now
								</>
							)}
						</button>
					</div>
				)}

				{/* Info line */}
				<div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
					<p className="leading-relaxed">
						The host hasn't started the meeting yet. You'll be let in
						automatically as soon as it begins.
					</p>
				</div>

				{/* Actions */}
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
					<button
						type="button"
						onClick={onBack}
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</button>

					<button
						type="button"
						onClick={onRetry}
						disabled={retrying}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-60"
					>
						{retrying ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Checking...
							</>
						) : (
							"Check now"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
