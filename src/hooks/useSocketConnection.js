import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

/**
 * Keeps a socket connection alive whenever the user is authenticated.
 * Mount this once near the top of the tree (inside AuthProvider).
 */
export const useSocketConnection = () => {
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		if (!isAuthenticated) return;

		connectSocket();

	}, [isAuthenticated]);

	// On logout, kill the socket
	useEffect(() => {
		if (!isAuthenticated) {
			disconnectSocket();
		}
	}, [isAuthenticated]);
};