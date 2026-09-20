import React from "react";
import { useNavigate } from "react-router-dom";
import {
	Link2,
	KeyRound,
	Lock,
	ArrowRight,
	Calendar,
	UserPlus,
} from "lucide-react";
import CopyButton from "../ui/CopyButton";

/**
 * @param {Object} credentials
 *   { meetingCode, meetingLink, password, scheduledAt, title }
 * @param {Function} onClose
 */
export default function CredentialsCard({ credentials, onClose, onInviteNow }) {
	const navigate = useNavigate();

	const { meetingCode, meetingLink, password, scheduledAt, title } =
		credentials;

	const startNow = () => {
		onClose?.();
		navigate(`/meeting/${meetingCode}`);
	};

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
				<p className="text-sm font-semibold text-emerald-700">
					✅ Meeting created
				</p>
				<p className="mt-1 text-xs text-emerald-600">
					{title} — share the info below with participants.
				</p>
			</div>

			{/* Meeting link */}
			<ShareRow
				icon={<Link2 className="h-4 w-4 text-[#3e4bc4]" />}
				label="Meeting link"
				value={meetingLink}
			/>

			{/* Meeting code */}
			<ShareRow
				icon={<KeyRound className="h-4 w-4 text-[#3e4bc4]" />}
				label="Meeting code"
				value={meetingCode}
			/>

			{/* Password (only if present) */}
			{password && (
				<ShareRow
					icon={<Lock className="h-4 w-4 text-[#3e4bc4]" />}
					label="Password"
					value={password}
					hint="Shown only once — copy it now"
				/>
			)}

			{/* Scheduled time */}
			{scheduledAt && (
				<div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
					<Calendar className="h-3.5 w-3.5" />
					Scheduled for{" "}
					{new Date(scheduledAt).toLocaleString(undefined, {
						dateStyle: "medium",
						timeStyle: "short",
					})}
				</div>
			)}

			{/* Invite friends after creation */}
			{onInviteNow && (
				<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
					<p className="text-sm font-semibold text-emerald-700">
						Invite Friend form Meeting Details
					</p>
				</div>
			)}

			{/* CTA */}
			<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					Close
				</button>
				<button
					type="button"
					onClick={startNow}
					className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02]"
				>
					Go to meeting
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

function ShareRow({ icon, label, value, hint }) {
	return (
		<div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
			<div className="mb-1.5 flex items-center gap-2">
				{icon}
				<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
					{label}
				</p>
			</div>
			<div className="flex items-center justify-between gap-2">
				<p className="truncate text-sm font-medium text-gray-800">{value}</p>
				<CopyButton text={value} label="Copy" className="shrink-0" />
			</div>
			{hint && <p className="mt-1 text-xs text-amber-600">{hint}</p>}
		</div>
	);
}
