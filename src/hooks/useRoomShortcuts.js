import { useEffect } from "react";

/**
 * Global keyboard shortcuts for the meeting room.
 *
 * @param {Object} handlers
 * @param {Function} handlers.onToggleMute     — M
 * @param {Function} handlers.onToggleCamera   — V
 * @param {Function} handlers.onToggleScreenShare — S
 * @param {Function} handlers.onToggleChat     — C
 * @param {Function} handlers.onTogglePeople   — P
 * @param {Function} handlers.onLeave          — Escape (or Alt+Q)
 * @param {Function} handlers.onToggleRecording — R (host only)
 */
export const useRoomShortcuts = (handlers) => {
	useEffect(() => {
		const isTyping = (el) => {
			if (!el) return false;
			const tag = el.tagName;
			return (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				tag === "SELECT" ||
				el.isContentEditable
			);
		};

		const onKey = (e) => {
			// Ignore when typing in inputs
			if (isTyping(e.target)) return;

			// Ignore with modifiers (avoid hijacking Ctrl+R, Cmd+P, etc.)
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			const key = e.key.toLowerCase();

			// Map
			switch (key) {
				case "m":
					e.preventDefault();
					handlers.onToggleMute?.();
					break;
				case "v":
					e.preventDefault();
					handlers.onToggleCamera?.();
					break;
				case "s":
					e.preventDefault();
					handlers.onToggleScreenShare?.();
					break;
				case "c":
					e.preventDefault();
					handlers.onToggleChat?.();
					break;
				case "p":
					e.preventDefault();
					handlers.onTogglePeople?.();
					break;
				case "r":
					// Only trigger if a handler exists (host only in practice)
					if (handlers.onToggleRecording) {
						e.preventDefault();
						handlers.onToggleRecording();
					}
					break;
				case "escape":
					e.preventDefault();
					handlers.onLeave?.();
					break;
				default:
					break;
			}
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handlers]);
};