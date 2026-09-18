import { useEffect, useRef } from "react";
import { connectSocket, getSocket, disconnectSocket } from "../lib/socket";

/**
 * Attach event listeners to the socket for the lifetime of the component.
 * Auto-connects on mount (optionally disconnects on unmount).
 *
 * @param {Object} handlers - { "event-name": fn, ... }
 * @param {Object} options - { autoDisconnect: boolean }
 */
export const useSocket = (handlers = {}, { autoDisconnect = false } = {}) => {
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		const socket = connectSocket();

		// Wrap each handler so it always calls the latest version
		const wrapped = Object.entries(handlersRef.current).map(
			([event, fn]) => {
				const listener = (...args) => handlersRef.current[event]?.(...args);
				socket.on(event, listener);
				return [event, listener];
			}
		);

		return () => {
			wrapped.forEach(([event, listener]) => socket.off(event, listener));
			if (autoDisconnect) disconnectSocket();
		};
	}, [autoDisconnect]);

	return getSocket();
};