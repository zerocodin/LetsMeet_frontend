import { useRef, useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Records a MediaStream locally via MediaRecorder.
 * On stop, triggers a browser download of the .webm file.
 */
export const useRecorder = ({ streamRef }) => {
	const recorderRef = useRef(null);
	const chunksRef = useRef([]);
	const startedAtRef = useRef(null);

	const [isRecording, setIsRecording] = useState(false);
	const [elapsed, setElapsed] = useState(0); // seconds

	//  Timer while recording
	useEffect(() => {
		if (!isRecording) return;

		const id = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
		}, 1000);

		return () => clearInterval(id);
	}, [isRecording]);

	//  Pick best supported mime type
	const getMimeType = () => {
		const candidates = [
			"video/webm;codecs=vp9,opus",
			"video/webm;codecs=vp8,opus",
			"video/webm",
			"video/mp4",
		];
		for (const mime of candidates) {
			if (window.MediaRecorder?.isTypeSupported?.(mime)) return mime;
		}
		return ""; // let the browser choose
	};

	//  Start
	const start = useCallback(() => {
		try {
			const stream = streamRef.current;
			if (!stream) {
				toast.error("No stream to record");
				return false;
			}

			if (typeof MediaRecorder === "undefined") {
				toast.error("Recording not supported in this browser");
				return false;
			}

			const mimeType = getMimeType();
			const recorder = new MediaRecorder(
				stream,
				mimeType ? { mimeType } : undefined,
			);

			chunksRef.current = [];

			recorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					chunksRef.current.push(e.data);
				}
			};

			recorder.onerror = (e) => {
				console.error("MediaRecorder error:", e.error || e);
				toast.error("Recording error");
				setIsRecording(false);
			};

			recorder.onstop = () => {
				const blob = new Blob(chunksRef.current, {
					type: chunksRef.current[0]?.type || "video/webm",
				});
				chunksRef.current = [];

				// Trigger local download
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				const stamp = new Date()
					.toISOString()
					.replace(/[:.]/g, "-")
					.slice(0, 19);
				a.download = `meeting-recording-${stamp}.webm`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);

				setIsRecording(false);
				setElapsed(0);
				startedAtRef.current = null;

				toast.success("Recording saved to your device");
			};

			// Start with a 1s timeslice so chunks stream in
			recorder.start(1000);

			recorderRef.current = recorder;
			startedAtRef.current = Date.now();
			setIsRecording(true);
			setElapsed(0);
			return true;
		} catch (err) {
			console.error("start recording error:", err);
			toast.error("Failed to start recording");
			return false;
		}
	}, [streamRef]);

	//  Stop
	const stop = useCallback(() => {
		const recorder = recorderRef.current;
		if (!recorder) return;

		if (recorder.state !== "inactive") {
			recorder.stop();
		}
		recorderRef.current = null;
	}, []);

	//  Auto-stop on unmount (safety)
	useEffect(() => {
		return () => {
			if (recorderRef.current?.state === "recording") {
				try {
					recorderRef.current.stop();
				} catch {}
			}
		};
	}, []);

	return {
		isRecording,
		elapsed,
		start,
		stop,
	};
};
