let ctx = null;

const getCtx = () => {
	if (!ctx) {
		try {
			const Ctor = window.AudioContext || window.webkitAudioContext;
			ctx = new Ctor();
		} catch {
			return null;
		}
	}
	return ctx;
};

/**
 * Play a short notification chirp.
 * @param {"join" | "leave" | "message"} type
 */
export const playChirp = (type = "join") => {
	const audioCtx = getCtx();
	if (!audioCtx) return;

	// Resume if browser suspended it (Chrome autoplay policy)
	if (audioCtx.state === "suspended") {
		audioCtx.resume().catch(() => {});
	}

	// Frequencies per type — rising for join, falling for leave
	const freqMap = {
		join: [660, 880],
		leave: [880, 660],
		message: [740, 740],
	};
	const [f1, f2] = freqMap[type] || freqMap.join;

	const now = audioCtx.currentTime;

	// Two tiny beeps
	beep(audioCtx, f1, now, 0.08);
	beep(audioCtx, f2, now + 0.09, 0.08);
};

function beep(audioCtx, freq, startTime, duration) {
	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	osc.type = "sine";
	osc.frequency.value = freq;

	// Fade in/out for a soft chirp (no clicks)
	gain.gain.setValueAtTime(0, startTime);
	gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
	gain.gain.linearRampToValueAtTime(0, startTime + duration);

	osc.connect(gain);
	gain.connect(audioCtx.destination);

	osc.start(startTime);
	osc.stop(startTime + duration + 0.02);
}

/**
 * Persistent preference helpers.
 */
const SOUND_KEY = "meetup_sound_enabled";

export const isSoundEnabled = () => {
	try {
		const v = localStorage.getItem(SOUND_KEY);
		return v === null ? true : v === "true";
	} catch {
		return true;
	}
};

export const setSoundEnabled = (enabled) => {
	try {
		localStorage.setItem(SOUND_KEY, enabled ? "true" : "false");
	} catch {}
};