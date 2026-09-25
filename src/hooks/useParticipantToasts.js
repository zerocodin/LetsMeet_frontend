import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { playChirp, isSoundEnabled } from "../lib/sound";

/**
 * Fires a toast + chirp when a remote participant joins or leaves.
 * Tracks socketId → name so "left" toasts show the actual name.
 *
 * @param {Array} participants   — from MeetingContext
 * @param {boolean} ready        — true once initial participant list is set
 */
export const useParticipantToasts = (participants, ready = true) => {
	const prevMapRef = useRef(new Map());      // socketId → name
	const hasSeededRef = useRef(false);        // ← NEW

	useEffect(() => {
		if (!ready) return;

		const currentMap = new Map(participants.map((p) => [p.socketId, p.name]));

		// First run — seed, don't fire toasts
		if (!hasSeededRef.current) {
			hasSeededRef.current = true;
			prevMapRef.current = currentMap;
			return;
		}

		// Joined — present now but not before
		participants.forEach((p) => {
			if (!prevMapRef.current.has(p.socketId)) {
				const name = p.name || "Someone";
				toast.success(`${name} joined`, { icon: "👋", duration: 2500 });
				if (isSoundEnabled()) playChirp("join");
			}
		});

		// Left — present before but not now
		prevMapRef.current.forEach((name, id) => {
			if (!currentMap.has(id)) {
				toast(`${name || "Someone"} left`, { icon: "👋", duration: 2000 });
				if (isSoundEnabled()) playChirp("leave");
			}
		});

		prevMapRef.current = currentMap;
	}, [participants, ready]);
};