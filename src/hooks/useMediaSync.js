import { useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";

/**
 * Two jobs:
 *  1. Sync isMuted / isCameraOff → track.enabled
 *  2. When isScreenSharing flips → start/stop getDisplayMedia, replace
 *     video track on all peer connections.
 *
 * @param {Object} options
 * @param {React.MutableRefObject<MediaStream|null>} options.localStreamRef
 * @param {React.MutableRefObject<MediaStream|null>} options.screenStreamRef
 * @param {React.MutableRefObject<Map>} options.peerConnections
 * @param {Function} options.onScreenShareEnded — called if browser stops share (e.g. user clicks "Stop sharing")
 */
export const useMediaSync = ({
	localStreamRef,
	screenStreamRef,
	peerConnections,
	onScreenShareEnded,
}) => {
	const lastMuted = useRef(null);
	const lastCameraOff = useRef(null);
	const lastSharing = useRef(null);

	// Mic + camera track enable/disable
	// Fired on any state change by calling code with the context values.
	// We can't use context directly here to keep this hook reusable.
	//
	// Instead, this hook exposes `applyMediaState`. The page will call it
	// inside a useEffect whenever isMuted / isCameraOff changes.
	//
	// Simpler: page calls applyMediaState(isMuted, isCameraOff).

	/**
	 * @param {boolean} isMuted
	 * @param {boolean} isCameraOff
	 */
	const applyMediaState = (isMuted, isCameraOff) => {
		const stream = localStreamRef.current;
		if (!stream) return;

		if (lastMuted.current !== isMuted) {
			const mic = stream.getAudioTracks()[0];
			if (mic) mic.enabled = !isMuted;
			lastMuted.current = isMuted;
		}

		if (lastCameraOff.current !== isCameraOff) {
			const cam = stream.getVideoTracks()[0];
			if (cam) cam.enabled = !isCameraOff;
			lastCameraOff.current = isCameraOff;
		}
	};

	// Screen-share lifecycle
	// Caller passes the current isScreenSharing value via syncScreenShare().
	// This keeps the hook decoupled from MeetingContext.
	const syncScreenShare = async (shouldBeSharing) => {
		if (lastSharing.current === shouldBeSharing) return;
		lastSharing.current = shouldBeSharing;

		const peers = peerConnections.current;

		if (shouldBeSharing) {
			// START screen share
			try {
				const screenStream = await navigator.mediaDevices.getDisplayMedia({
					video: true, //{ cursor: "always" },
					audio: false,
				});
				screenStreamRef.current = screenStream;

				// const screenTrack = screenStream.getVideoTracks()[0];
				const screenTrack = screenStream.getVideoTracks()[0];
				try {
					await screenTrack.applyConstraints({ cursor: "always" });
				} catch {}

				// If user clicks the browser's native "Stop sharing",
				// we need to notify the app so context also flips off.
				screenTrack.onended = () => {
					screenStreamRef.current = null;
					lastSharing.current = false;
					onScreenShareEnded?.();
				};

				// Replace camera track with screen track on every peer
				const promises = [];
				peers.forEach(async (pc, socketId) => {
					const sender = pc
						.getSenders()
						.find((s) => s.track && s.track.kind === "video");

					if (sender) {
						try {
							await sender.replaceTrack(screenTrack);

							// Renegotiate: send a fresh offer with the new track
							const offer = await pc.createOffer();
							await pc.setLocalDescription(offer);

							getSocket().emit("webrtc-offer", {
								targetSocketId: socketId,
								offer,
							});
						} catch (err) {
							console.error(`replaceTrack failed for ${socketId}:`, err);
						}
					}
				});
				await Promise.all(promises);
			} catch (err) {
				if (err.name !== "NotAllowedError") {
					console.error("getDisplayMedia error:", err);
				}
				// Roll back — signal to caller to flip context off
				lastSharing.current = false;
				onScreenShareEnded?.();
			}
		} else {
			// STOP screen share — revert to camera track
			const screenStream = screenStreamRef.current;

			const cameraTrack = localStreamRef.current?.getVideoTracks?.()[0] || null;

			if (cameraTrack) {
				peers.forEach(async (pc, socketId) => {
					const sender = pc
						.getSenders()
						.find((s) => s.track && s.track.kind === "video");
					if (sender) {
						try {
							await sender.replaceTrack(cameraTrack);
							const offer = await pc.createOffer();
							await pc.setLocalDescription(offer);
							getSocket().emit("webrtc-offer", {
								targetSocketId: socketId,
								offer,
							});
						} catch (err) {
							console.error(`revert track failed for ${socketId}:`, err);
						}
					}
				});
			}

			if (screenStream) {
				screenStream.getTracks().forEach((t) => t.stop());
				screenStreamRef.current = null;
			}
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((t) => t.stop());
				screenStreamRef.current = null;
			}
		};
	}, [screenStreamRef]);

	return { applyMediaState, syncScreenShare };
};
