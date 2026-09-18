import React, { useState } from "react";
import { Loader2, Lock, Calendar, Clock, Users, FileText } from "lucide-react";

export default function CreateMeetingForm({
	onSubmit,
	isSubmitting,
	mode = "schedule",
}) {
	// Default scheduledAt = 30 minutes from now, rounded to nearest 15 min
	const defaultDate = (() => {
		const d = new Date();
		d.setMinutes(d.getMinutes() + 30);
		d.setSeconds(0, 0);
		return d;
	})();

	const [form, setForm] = useState({
		title: "",
		description: "",
		scheduledAt: defaultDate.toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm
		duration: 60,
		isPrivate: false,
		password: "",
		maxParticipants: 100,
		waitingRoomEnabled: false,
	});

	const handleChange = (field, value) =>
		setForm((prev) => ({ ...prev, [field]: value }));

	const handleSubmit = (e) => {
		e.preventDefault();

		if (mode === "now") {
			return onSubmit({
				title: form.title || "Instant Meeting",
				description: form.description,
				scheduledAt: new Date().toISOString(),
				duration: 60,
				isPrivate: false,
				password: null,
				maxParticipants: 100,
				waitingRoomEnabled: false,
			});
		}

		// schedule mode
		onSubmit({
			title: form.title,
			description: form.description,
			scheduledAt: new Date(form.scheduledAt).toISOString(),
			duration: Number(form.duration),
			isPrivate: form.isPrivate,
			password: form.password.trim() || undefined,
			maxParticipants: Number(form.maxParticipants),
			waitingRoomEnabled: form.waitingRoomEnabled,
		});
	};

	// Quick "Start now" UI
	if (mode === "now") {
		return (
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="mb-1.5 block text-sm font-medium text-gray-700">
						Meeting name (optional)
					</label>
					<input
						type="text"
						value={form.title}
						onChange={(e) => handleChange("title", e.target.value)}
						placeholder="Instant Meeting"
						maxLength={100}
						className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-60"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Starting...
						</>
					) : (
						"Start Meeting"
					)}
				</button>
			</form>
		);
	}

	// Full schedule form
	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Title */}
			<div>
				<label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
					<FileText className="h-3.5 w-3.5" />
					Meeting title
				</label>
				<input
					type="text"
					required
					value={form.title}
					onChange={(e) => handleChange("title", e.target.value)}
					placeholder="Team Standup"
					maxLength={100}
					className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
				/>
			</div>

			{/* Description */}
			<div>
				<label className="mb-1.5 block text-sm font-medium text-gray-700">
					Description (optional)
				</label>
				<textarea
					rows={2}
					maxLength={500}
					value={form.description}
					onChange={(e) => handleChange("description", e.target.value)}
					placeholder="What's this meeting about?"
					className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
				/>
			</div>

			{/* Date + Duration (2 columns) */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Calendar className="h-3.5 w-3.5" />
						Date & time
					</label>
					<input
						type="datetime-local"
						required
						value={form.scheduledAt}
						onChange={(e) => handleChange("scheduledAt", e.target.value)}
						className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
					/>
				</div>

				<div>
					<label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Clock className="h-3.5 w-3.5" />
						Duration
					</label>
					<select
						value={form.duration}
						onChange={(e) => handleChange("duration", e.target.value)}
						className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
					>
						{[15, 30, 45, 60, 90, 120, 180].map((d) => (
							<option key={d} value={d}>
								{d} min
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Max participants */}
			<div>
				<label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
					<Users className="h-3.5 w-3.5" />
					Max participants
				</label>
				<input
					type="number"
					min={2}
					max={100}
					value={form.maxParticipants}
					onChange={(e) => handleChange("maxParticipants", e.target.value)}
					className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
				/>
			</div>

			{/* Private + password */}
			<div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
				<label className="flex cursor-pointer items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-700">
							Private meeting
						</p>
						<p className="text-xs text-gray-500">
							Only invited users can join
						</p>
					</div>
					<input
						type="checkbox"
						checked={form.isPrivate}
						onChange={(e) => handleChange("isPrivate", e.target.checked)}
						className="h-4 w-4 rounded border-gray-300 text-[#3e4bc4] focus:ring-[#3e4bc4]"
					/>
				</label>

				<div className="mt-3">
					<label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
						<Lock className="h-3.5 w-3.5" />
						Password (optional)
					</label>
					<input
						type="text"
						value={form.password}
						onChange={(e) => handleChange("password", e.target.value)}
						placeholder="Leave empty to auto-generate"
						maxLength={50}
						className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
					/>
					<p className="mt-1 text-xs text-gray-400">
						A random password will be generated if left blank.
					</p>
				</div>
			</div>

			{/* Waiting room */}
			<label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4">
				<div>
					<p className="text-sm font-medium text-gray-700">
						Enable waiting room
					</p>
					<p className="text-xs text-gray-500">
						Guests wait until the host admits them
					</p>
				</div>
				<input
					type="checkbox"
					checked={form.waitingRoomEnabled}
					onChange={(e) =>
						handleChange("waitingRoomEnabled", e.target.checked)
					}
					className="h-4 w-4 rounded border-gray-300 text-[#3e4bc4] focus:ring-[#3e4bc4]"
				/>
			</label>

			{/* Submit */}
			<button
				type="submit"
				disabled={isSubmitting}
				className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.01] disabled:opacity-60"
			>
				{isSubmitting ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Creating...
					</>
				) : (
					"Schedule Meeting"
				)}
			</button>
		</form>
	);
}