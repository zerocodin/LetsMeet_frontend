import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";
import { RTC_CONFIG } from "../lib/webrtcConfig";

/**
 * WebRTC hook — manages one RTCPeerConnection per remote participant.
 */
export const useWebRTC = ({
	localStreamRef,
	screenStreamRef,
	peerConnections,
	onRemoteStream,
	onRemoteStreamRemoved,
	getParticipantMeta,
}) => {
	// Stable refs so callbacks don't need to be in deps
	const onRemoteStreamRef = useRef(onRemoteStream);
	const onRemoveRef = useRef(onRemoteStreamRemoved);
	const getMetaRef = useRef(getParticipantMeta);
	useEffect(() => {
		onRemoteStreamRef.current = onRemoteStream;
		onRemoveRef.current = onRemoteStreamRemoved;
		getMetaRef.current = getParticipantMeta;
	});

	// CREATE A PEER CONNECTION
	const createPeer = useCallback(
		(remoteSocketId) => {
			// Reuse if exists
			if (peerConnections.current.has(remoteSocketId)) {
				return peerConnections.current.get(remoteSocketId);
			}

			const pc = new RTCPeerConnection(RTC_CONFIG);

			//  Attach local tracks so remote sees/hears us
			const localStream = localStreamRef.current;
			if (localStream) {
				localStream.getTracks().forEach((track) => {
					pc.addTrack(track, localStream);
				});
			}

			// Receive remote tracks 
			const remoteStream = new MediaStream();

			pc.ontrack = (event) => {
				event.streams[0]?.getTracks().forEach((track) => {
					// Avoid duplicates when track already added
					if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
						remoteStream.addTrack(track);
					}
				});

				// If the event has its own stream (modern browsers), use that instead
				const stream = event.streams[0] || remoteStream;
				onRemoteStreamRef.current?.(remoteSocketId, stream, getMetaRef.current?.(remoteSocketId));
			};

			// ICE candidates → send to remote 
			pc.onicecandidate = (event) => {
				if (event.candidate) {
					const socket = getSocket();
					socket.emit("webrtc-ice-candidate", {
						targetSocketId: remoteSocketId,
						candidate: event.candidate,
					});
				}
			};

			// Connection state tracking 
			pc.onconnectionstatechange = () => {
				console.log(`[PC ${remoteSocketId}] state: ${pc.connectionState}`);
				if (
					pc.connectionState === "failed" ||
					pc.connectionState === "closed"
				) {
					// Try ICE restart once
					if (pc.connectionState === "failed") {
						console.warn(`[PC ${remoteSocketId}] connection failed, restarting ICE`);
						try {
							pc.restartIce();
						} catch (err) {
							console.error("ICE restart failed:", err);
						}
					}
				}
			};

			pc.oniceconnectionstatechange = () => {
				if (pc.iceConnectionState === "disconnected") {
					console.warn(`[PC ${remoteSocketId}] ICE disconnected`);
					// Give it 5s to recover before we consider it dead
					setTimeout(() => {
						if (pc.iceConnectionState === "disconnected") {
							console.warn(`[PC ${remoteSocketId}] still disconnected → closing`);
							closePeer(remoteSocketId);
						}
					}, 5000);
				}
			};

			peerConnections.current.set(remoteSocketId, pc);
			return pc;
		},
		[localStreamRef, peerConnections]
	);

	// CLOSE A PEER
	const closePeer = useCallback(
		(remoteSocketId) => {
			const pc = peerConnections.current.get(remoteSocketId);
			if (pc) {
				// Stop senders
				pc.getSenders().forEach((sender) => {
					try {
						sender.track?.stop?.();
					} catch {}
				});
				pc.close();
				peerConnections.current.delete(remoteSocketId);
			}
			onRemoveRef.current?.(remoteSocketId);
		},
		[peerConnections]
	);

	// INITIATE OFFER (new joiner → existing participants)
	const callPeer = useCallback(
		async (remoteSocketId) => {
			try {
				const pc = createPeer(remoteSocketId);

				const offer = await pc.createOffer({
					offerToReceiveAudio: true,
					offerToReceiveVideo: true,
				});
				await pc.setLocalDescription(offer);

				const socket = getSocket();
				socket.emit("webrtc-offer", {
					targetSocketId: remoteSocketId,
					offer,
				});
			} catch (err) {
				console.error("callPeer error:", err);
			}
		},
		[createPeer]
	);

	// SOCKET EVENT HANDLERS — bound once
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;

		// Incoming offer → we are the answerer
		const onOffer = async ({ fromSocketId, offer }) => {
			try {
				const pc = createPeer(fromSocketId);

				await pc.setRemoteDescription(new RTCSessionDescription(offer));

				// Apply any queued ICE candidates that arrived before the offer
				await flushQueuedCandidates(fromSocketId, pc);

				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);

				socket.emit("webrtc-answer", {
					targetSocketId: fromSocketId,
					answer,
				});
			} catch (err) {
				console.error("onOffer error:", err);
			}
		};

		// Incoming answer → we are the offerer
		const onAnswer = async ({ fromSocketId, answer }) => {
			try {
				const pc = peerConnections.current.get(fromSocketId);
				if (!pc) return;

				if (pc.signalingState === "have-local-offer") {
					await pc.setRemoteDescription(new RTCSessionDescription(answer));
					await flushQueuedCandidates(fromSocketId, pc);
				} else {
					console.warn(
						`[PC ${fromSocketId}] answer received in wrong state: ${pc.signalingState}`
					);
				}
			} catch (err) {
				console.error("onAnswer error:", err);
			}
		};

		//Incoming ICE candidate
		const onIce = async ({ fromSocketId, candidate }) => {
			try {
				const pc = peerConnections.current.get(fromSocketId);
				if (!pc) {
					// Queue until we have a peer
					queueCandidate(fromSocketId, candidate);
					return;
				}

				// If remote description isn't set yet, queue
				if (!pc.remoteDescription || !pc.remoteDescription.type) {
					queueCandidate(fromSocketId, candidate);
					return;
				}

				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} catch (err) {
				console.error("onIce error:", err);
			}
		};

		// New participant joined → we call them
		// Rule: the EXISTING participant initiates the offer, not the joiner.
		// This avoids both sides offering at the same time (glare).
		const onParticipantJoined = ({ socketId }) => {
			// Small delay ensures their `join-meeting` ack has been processed server-side
			setTimeout(() => callPeer(socketId), 500);
		};

		// articipant left → close their peer  
		const onParticipantLeft = ({ socketId }) => {
			closePeer(socketId);
		};

		socket.on("webrtc-offer", onOffer);
		socket.on("webrtc-answer", onAnswer);
		socket.on("webrtc-ice-candidate", onIce);
		socket.on("participant-joined", onParticipantJoined);
		socket.on("participant-left", onParticipantLeft);

		return () => {
			socket.off("webrtc-offer", onOffer);
			socket.off("webrtc-answer", onAnswer);
			socket.off("webrtc-ice-candidate", onIce);
			socket.off("participant-joined", onParticipantJoined);
			socket.off("participant-left", onParticipantLeft);
		};
	}, [createPeer, callPeer, closePeer, peerConnections]);

	// ICE CANDIDATE QUEUE (handles out-of-order signaling)
	const candidateQueue = useRef(new Map()); // socketId → RTCIceCandidateInit[]

	const queueCandidate = (socketId, candidate) => {
		if (!candidateQueue.current.has(socketId)) {
			candidateQueue.current.set(socketId, []);
		}
		candidateQueue.current.get(socketId).push(candidate);
	};

	const flushQueuedCandidates = async (socketId, pc) => {
		const queued = candidateQueue.current.get(socketId);
		if (!queued || queued.length === 0) return;

		for (const cand of queued) {
			try {
				await pc.addIceCandidate(new RTCIceCandidate(cand));
			} catch (err) {
				console.error("Failed to add queued candidate:", err);
			}
		}
		candidateQueue.current.delete(socketId);
	};

	// SCREEN-SHARE TRACK REPLACEMENT (renegotiate)
	const replaceVideoTrackOnAllPeers = useCallback(
		async (newTrack) => {
			const promises = [];
			peerConnections.current.forEach(async (pc, socketId) => {
				const sender = pc.getSenders().find((s) => s.track?.kind === "video");
				if (sender) {
					try {
						await sender.replaceTrack(newTrack);

						// Renegotiate: send a fresh offer with the new track
						const offer = await pc.createOffer();
						await pc.setLocalDescription(offer);

						getSocket().emit("webrtc-offer", {
							targetSocketId: socketId,
							offer,
						});
					} catch (err) {
						console.error(`Failed to replace track on ${socketId}:`, err);
					}
				}
			});
			return Promise.all(promises);
		},
		[peerConnections]
	);

	// CALL ALL EXISTING PEERS (used after join ack)
	const callAllPeers = useCallback(
		(existingSocketIds) => {
			existingSocketIds.forEach((id) => callPeer(id));
		},
		[callPeer]
	);

	// CLEANUP ALL PEERS
	const closeAllPeers = useCallback(() => {
		peerConnections.current.forEach((_, socketId) => closePeer(socketId));
		peerConnections.current.clear();
		candidateQueue.current.clear();
	}, [peerConnections, closePeer]);

	return {
		callPeer,
		callAllPeers,
		closePeer,
		closeAllPeers,
		replaceVideoTrackOnAllPeers,
	};
};