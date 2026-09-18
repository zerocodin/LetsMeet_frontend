import React from "react";

const CONFIG = {
	SCHEDULED: {
		label: "Scheduled",
		className: "bg-indigo-50 text-indigo-700 border-indigo-200",
		dot: "bg-indigo-500",
	},
	ONGOING: {
		label: "Live",
		className: "bg-emerald-50 text-emerald-700 border-emerald-200",
		dot: "bg-emerald-500 animate-pulse",
	},
	COMPLETED: {
		label: "Completed",
		className: "bg-gray-100 text-gray-600 border-gray-200",
		dot: "bg-gray-400",
	},
	CANCELLED: {
		label: "Cancelled",
		className: "bg-red-50 text-red-700 border-red-200",
		dot: "bg-red-500",
	},
};

export default function StatusBadge({ status }) {
	const cfg = CONFIG[status] || CONFIG.SCHEDULED;
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
			{cfg.label}
		</span>
	);
}