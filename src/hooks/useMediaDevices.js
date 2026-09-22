import { useEffect, useRef, useCallback, useState } from "react";
import toast from "react-hot-toast";

/**
 * Manages local camera + mic and screen-share streams.
 * Does NOT touch WebRTC — that's the job of useWebRTC later.
 * */
export const useMediaDevices = ({
	startCamera = true,
	startMic = true,
	onStreamReady,
} = {}) => {
	const localStreamRef = useRef(null);
	const screenStreamRef = useRef(null);
	const cameraTrackRef = useRef(null);
	const micTrackRef = useRef(null);

	const [permissionError, setPermissionError] = useState(null);
	const [devices, setDevices] = useState({ cameras: [], mics: [] });
	const [activeCameraId, setActiveCameraId] = useState(null);
	const [activeMicId, setActiveMicId] = useState(null);

	// ACQUIRE STREAM ON MOUNT
	useEffect(() => {
		let cancelled = false;

		const init = async () => {
			try {
				const constraints = {
					video: startCamera
						? {
								width: { ideal: 1280 },
								height: { ideal: 720 },
								facingMode: "user",
							}
						: { width: { ideal: 640 }, height: { ideal: 360 } },
					audio: startMic
						? {
								echoCancellation: true,
								noiseSuppression: true,
								autoGainControl: true,
							}
						: true,
				};

				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				if (cancelled) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}

				// Apply the initial enabled state
				const videoTrack = stream.getVideoTracks()[0];
				const audioTrack = stream.getAudioTracks()[0];

				if (videoTrack) videoTrack.enabled = !!startCamera;
				if (audioTrack) audioTrack.enabled = !!startMic;

				localStreamRef.current = stream;
				cameraTrackRef.current = videoTrack || null;
				micTrackRef.current = audioTrack || null;

				// Enumerate devices (labels become available after permission)
				const allDevices = await navigator.mediaDevices.enumerateDevices();
				const cameras = allDevices.filter((d) => d.kind === "videoinput");
				const mics = allDevices.filter((d) => d.kind === "audioinput");
				setDevices({ cameras, mics });

				if (cameraTrackRef.current) {
					setActiveCameraId(cameraTrackRef.current.getSettings().deviceId);
				}
				if (micTrackRef.current) {
					setActiveMicId(micTrackRef.current.getSettings().deviceId);
				}

				onStreamReady?.(stream);
			} catch (err) {
				console.error("getUserMedia error:", err);
				setPermissionError(err.message);
				toast.error(
					err.name === "NotAllowedError"
						? "Camera/mic permission denied"
						: "Unable to access camera or mic",
				);
			}
		};

		init();

		return () => {
			cancelled = true;
			if (localStreamRef.current) {
				localStreamRef.current.getTracks().forEach((t) => t.stop());
				localStreamRef.current = null;
			}
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((t) => t.stop());
				screenStreamRef.current = null;
			}
		};
	}, [startCamera, startMic, onStreamReady]);

	// ENABLE / DISABLE CAMERA (toggle track.enabled)
	const setCameraEnabled = useCallback((enabled) => {
		const track = cameraTrackRef.current;
		if (track) track.enabled = enabled;
	}, []);

	// ENABLE / DISABLE MIC
	const setMicEnabled = useCallback((enabled) => {
		const track = micTrackRef.current;
		if (track) track.enabled = enabled;
	}, []);

	// SWITCH CAMERA (deviceId)
	const switchCamera = useCallback(async (deviceId) => {
		try {
			const newTrack = await navigator.mediaDevices.getUserMedia({
				video: { deviceId: { exact: deviceId } },
			});
			const newVideoTrack = newTrack.getVideoTracks()[0];

			// Replace in the local stream
			const stream = localStreamRef.current;
			if (stream) {
				const old = stream.getVideoTracks()[0];
				if (old) {
					stream.removeTrack(old);
					old.stop();
				}
				stream.addTrack(newVideoTrack);
			}

			cameraTrackRef.current = newVideoTrack;
			setActiveCameraId(deviceId);
			return newVideoTrack;
		} catch (err) {
			toast.error("Failed to switch camera");
			throw err;
		}
	}, []);

	// SWITCH MIC
	const switchMic = useCallback(async (deviceId) => {
		try {
			const newStream = await navigator.mediaDevices.getUserMedia({
				audio: { deviceId: { exact: deviceId } },
			});
			const newTrack = newStream.getAudioTracks()[0];

			const stream = localStreamRef.current;
			if (stream) {
				const old = stream.getAudioTracks()[0];
				if (old) {
					stream.removeTrack(old);
					old.stop();
				}
				stream.addTrack(newTrack);
			}

			micTrackRef.current = newTrack;
			setActiveMicId(deviceId);
			return newTrack;
		} catch (err) {
			toast.error("Failed to switch mic");
			throw err;
		}
	}, []);

	// SCREEN SHARE (start / stop)
	const startScreenShare = useCallback(async () => {
		try {
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { cursor: "always" },
				audio: false,
			});
			screenStreamRef.current = screenStream;

			// Auto-stop when user clicks browser's "Stop sharing"
			screenStream.getVideoTracks()[0].onended = () => {
				screenStreamRef.current = null;
				// Parent will detect and toggle off — let's return a signal
				if (typeof screenStream._onEnded === "function") {
					screenStream._onEnded();
				}
			};

			return screenStream;
		} catch (err) {
			if (err.name !== "NotAllowedError") {
				toast.error("Failed to start screen share");
			}
			throw err;
		}
	}, []);

	const stopScreenShare = useCallback(() => {
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((t) => t.stop());
			screenStreamRef.current = null;
		}
	}, []);

	return {
		// refs
		localStreamRef,
		screenStreamRef,

		// state
		permissionError,
		devices,
		activeCameraId,
		activeMicId,

		// methods
		setCameraEnabled,
		setMicEnabled,
		switchCamera,
		switchMic,
		startScreenShare,
		stopScreenShare,
	};
};
