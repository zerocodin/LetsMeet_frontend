import React from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	XCircle,
	Lock,
	Users,
	ArrowLeft,
	Home,
} from "lucide-react";

const ICONS = {
	NOT_FOUND: XCircle,
	CANCELLED: XCircle,
	COMPLETED: XCircle,
	PRIVATE: Lock,
	FULL: Users,
	UNKNOWN: AlertTriangle,
};

const DEFAULT_MESSAGES = {
	NOT_FOUND: "This meeting doesn't exist or was deleted.",
	CANCELLED: "The host cancelled this meeting.",
	COMPLETED: "This meeting has already ended.",
	PRIVATE: "This is a private meeting. You need an invite to join.",
	FULL: "This meeting is at maximum capacity.",
	UNKNOWN: "Something went wrong while trying to join.",
};

/**
 * @param {string} code  — enum: NOT_FOUND | CANCELLED | COMPLETED | PRIVATE | FULL | UNKNOWN
 * @param {string} message
 */
export default function JoinError({ code = "UNKNOWN", message }) {
	const navigate = useNavigate();
	const Icon = ICONS[code] || ICONS.UNKNOWN;
	const fallbackMessage = DEFAULT_MESSAGES[code] || DEFAULT_MESSAGES.UNKNOWN;

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
			<div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur-xl">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
					<Icon className="h-6 w-6" />
				</div>

				<h2 className="text-lg font-bold text-gray-800">
					Can't join this meeting
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					{message || fallbackMessage}
				</p>

				<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						<ArrowLeft className="h-4 w-4" />
						Go back
					</button>
					<button
						onClick={() => navigate("/meet")}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02]"
					>
						<Home className="h-4 w-4" />
						My meetings
					</button>
				</div>
			</div>
		</div>
	);
}
