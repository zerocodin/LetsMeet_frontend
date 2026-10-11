/**
 * Format seconds into a human-friendly duration.
 * Examples:
 *   45    → "45s"
 *   125   → "2m 5s"
 *   3720  → "1h 2m"
 *   86400 → "24h"
 */
export const formatDuration = (seconds) => {
	if (!seconds || seconds < 0) return "0s";

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;

	if (h > 0) {
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}
	if (m > 0) {
		return s > 0 ? `${m}m ${s}s` : `${m}m`;
	}
	return `${s}s`;
};

/**
 * Live duration: from joinedAt to now (or leftAt if provided).
 */
export const liveDuration = (joinedAt, leftAt) => {
	const end = leftAt ? new Date(leftAt).getTime() : Date.now();
	const start = new Date(joinedAt).getTime();
	return Math.max(0, Math.floor((end - start) / 1000));
};

/**
 * Format time-only label like "3:42 PM".
 */
export const formatTime = (date) => {
	if (!date) return "";
	return new Date(date).toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
};