import React from "react";
import { LogOut, XCircle, Users } from "lucide-react";
import Modal from "../ui/Modal";

/**
 * @param {boolean} open
 * @param {Function} onClose
 * @param {Function} onLeave          — "leave meeting" (self)
 * @param {Function} onEndForAll      — only rendered when isHost
 * @param {boolean} isHost
 * @param {number} participantCount   — used in "end for all" copy
 */
export default function LeaveConfirmModal({
	open,
	onClose,
	onLeave,
	onEndForAll,
	isHost,
	participantCount,
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title={isHost ? "Leave or end meeting?" : "Leave meeting?"}
			maxWidth="max-w-md"
		>
			<div className="space-y-3">
				{/* Participant count info */}
				<div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
					<Users className="h-3.5 w-3.5" />
					{participantCount} {participantCount === 1 ? "person" : "people"} in
					the meeting
				</div>

				{/* Leave for self */}
				<button
					onClick={onLeave}
					className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
				>
					<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
						<LogOut className="h-5 w-5" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-semibold text-gray-800">
							Leave meeting
						</p>
						<p className="text-xs text-gray-500">
							The meeting continues for others
						</p>
					</div>
				</button>

				{/* End for all (host only) */}
				{isHost && (
					<button
						onClick={onEndForAll}
						className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4 text-left transition-all hover:border-red-300 hover:bg-red-50"
					>
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
							<XCircle className="h-5 w-5" />
						</div>
						<div className="flex-1">
							<p className="text-sm font-semibold text-red-700">
								End meeting for all
							</p>
							<p className="text-xs text-red-500">
								Everyone will be removed
							</p>
						</div>
					</button>
				)}

				{/* Cancel */}
				<button
					onClick={onClose}
					className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					Cancel
				</button>
			</div>
		</Modal>
	);
}