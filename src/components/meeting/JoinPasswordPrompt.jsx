import React, { useState } from "react";
import { Lock, Loader2, ArrowLeft } from "lucide-react";

/**
 * @param {Function} onSubmit  — async (password) => void
 * @param {Function} onBack
 * @param {boolean} loading
 * @param {string} error       — server error message to display
 * @param {Object} meeting     — { title, meetingCode } for context
 */
export default function JoinPasswordPrompt({
	onSubmit,
	onBack,
	loading,
	error,
	meeting,
}) {
	const [password, setPassword] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!password.trim()) return;
		onSubmit(password);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
			<div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
				{/* Header */}
				<div className="mb-5 flex items-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#3e4bc4] to-[#8B5CF6] text-white">
						<Lock className="h-5 w-5" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-800">
							Password required
						</h2>
						<p className="text-xs text-gray-500">
							{meeting?.title || "This meeting"} is protected
						</p>
					</div>
				</div>

				{/* Meeting code display */}
				<div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-center">
					<p className="text-xs text-gray-500">Meeting code</p>
					<p className="font-mono text-sm font-semibold text-gray-800">
						{meeting?.meetingCode}
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700">
							Enter password
						</label>
						<input
							type="password"
							autoFocus
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Meeting password"
							disabled={loading}
							className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#3e4bc4] focus:ring-2 focus:ring-[#3e4bc4]/20"
						/>
						{error && (
							<p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
						)}
					</div>

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
						<button
							type="button"
							onClick={onBack}
							disabled={loading}
							className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</button>
						<button
							type="submit"
							disabled={loading || !password.trim()}
							className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3e4bc4] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-60"
						>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Joining...
								</>
							) : (
								"Join meeting"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}