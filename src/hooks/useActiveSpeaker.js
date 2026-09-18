import { useEffect, useRef, useState } from "react";

/**
 * Monitors audio levels from all active streams and returns the socketId
 * (or "self") of the loudest speaker above a threshold.
 *
 * @param {Object} options
 * @param {MediaStream|null} options.localStream
 * @param {Map} options.remoteStreams    — socketId → MediaStream
 * @param {number} options.threshold     — 0..1 (default 0.02)
 * @param {number} options.debounceMs    — how long a speaker stays "active" after dropping (default 1200)
 */
export const useActiveSpeaker = ({
	localStream,
	remoteStreams,
	threshold = 0.02,
	debounceMs = 1200,
}) => {
	const [activeSpeaker, setActiveSpeaker] = useState(null); // socketId | "self" | null

	const audioContextRef = useRef(null);
	const analysersRef = useRef(new Map()); // key → { analyser, dataArray, source }
	const lastHeardRef = useRef(new Map()); // key → timestamp

	// Setup audio context on first stream
	useEffect(() => {
		if (!audioContextRef.current) {
			try {
				const Ctx = window.AudioContext || window.webkitAudioContext;
				audioContextRef.current = new Ctx();
			} catch (err) {
				console.warn("AudioContext unavailable:", err);
				return;
			}
		}
	}, []);

	// Attach analysers to streams
	useEffect(() => {
		const ctx = audioContextRef.current;
		if (!ctx) return;

		const analysers = analysersRef.current;
		const wantedKeys = new Set();

		const attach = (key, stream) => {
			if (!stream) return;
			// Already attached?
			if (analysers.has(key)) return;

			// Only attach if there's an audio track
			if (stream.getAudioTracks().length === 0) return;

			try {
				const source = ctx.createMediaStreamSource(stream);
				const analyser = ctx.createAnalyser();
				analyser.fftSize = 512;
				analyser.smoothingTimeConstant = 0.6;

				source.connect(analyser);

				const dataArray = new Uint8Array(analyser.frequencyBinCount);
				analysers.set(key, { analyser, dataArray, source });
			} catch (err) {
				console.warn(`Failed to attach analyser for ${key}:`, err);
			}
		};

		// Attach local
		if (localStream) {
			wantedKeys.add("self");
			attach("self", localStream);
		}

		// Attach remotes
		remoteStreams.forEach((stream, socketId) => {
			wantedKeys.add(socketId);
			attach(socketId, stream);
		});

		// Detach analysers for streams no longer present
		analysers.forEach((_, key) => {
			if (!wantedKeys.has(key)) {
				try {
					analysers.get(key).source.disconnect();
				} catch {}
				analysers.delete(key);
				lastHeardRef.current.delete(key);
			}
		});
	}, [localStream, remoteStreams]);

	// Polling loop
	useEffect(() => {
		let rafId = null;

		const tick = () => {
			const analysers = analysersRef.current;
			if (analysers.size === 0) {
				rafId = requestAnimationFrame(tick);
				return;
			}

			const now = Date.now();
			let loudest = null;
			let loudestLevel = threshold;

			analysers.forEach(({ analyser, dataArray }, key) => {
				analyser.getByteFrequencyData(dataArray);
				// Compute average amplitude (only lower bins = voice range)
				let sum = 0;
				const voiceBins = Math.min(24, dataArray.length);
				for (let i = 0; i < voiceBins; i++) sum += dataArray[i];
				const avg = sum / voiceBins / 255; // 0..1

				if (avg > threshold) {
					lastHeardRef.current.set(key, now);
				}

				if (avg > loudestLevel) {
					loudestLevel = avg;
					loudest = key;
				}
			});

			// If we found a loud speaker, use them
			if (loudest) {
				setActiveSpeaker(loudest);
			} else {
				// Otherwise keep the last-heard speaker if within debounce window
				let recent = null;
				let recentTime = 0;
				lastHeardRef.current.forEach((t, key) => {
					if (now - t < debounceMs && t > recentTime) {
						recent = key;
						recentTime = t;
					}
				});
				setActiveSpeaker(recent);
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [threshold, debounceMs]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			analysersRef.current.forEach(({ source }) => {
				try {
					source.disconnect();
				} catch {}
			});
			analysersRef.current.clear();
			if (audioContextRef.current) {
				audioContextRef.current.close().catch(() => {});
				audioContextRef.current = null;
			}
		};
	}, []);

	return activeSpeaker;
};