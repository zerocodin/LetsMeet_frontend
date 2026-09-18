import { io } from "socket.io-client";
import { socketURL } from "../api/urlEndPoint";

let socket = null;

/**
 * Get (or create) the singleton socket.
 * Auto-connects on first call.
 */
export const getSocket = () => {
	if (!socket) {
		socket = io(socketURL, {
			withCredentials: true, // sends JWT cookie for auth
			autoConnect: false,
			transports: ["websocket"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});
	}
	return socket;
};

/**
 * Connect the socket (idempotent).
 */
export const connectSocket = () => {
	const s = getSocket();
	if (!s.connected) s.connect();
	return s;
};

/**
 * Disconnect + clean up all listeners.
 * Call this when leaving the meeting page.
 */
export const disconnectSocket = () => {
	if (socket) {
		socket.removeAllListeners();
		socket.disconnect();
		socket = null;
	}
};