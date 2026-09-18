import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket, connectSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

/**
 * Chat hook — in-memory messages + socket send/receive.
 * Messages are NOT persisted to DB yet (Step 9 will handle that).
 *
 * @param {string} meetingId
 */
export const useChat = (meetingId) => {
	const { user } = useAuth();
	const [messages, setMessages] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isPanelOpen, setIsPanelOpen] = useState(false);

	// Receive messages
	useEffect(() => {
		const socket = connectSocket();
		if (!socket) return;

		const onMessage = (msg) => {
			setMessages((prev) => [...prev, msg]);
			if (!isPanelOpen) setUnreadCount((c) => c + 1);
		};

		socket.on("chat-message", onMessage);
		return () => socket.off("chat-message", onMessage);
	}, [isPanelOpen]);

	// Send
	const sendMessage = useCallback(
		(text) => {
			const trimmed = text?.trim();
			if (!trimmed) return;

			const socket = getSocket();
			if (!socket?.connected) return;

			socket.emit("send-chat", { message: trimmed }, (ack) => {
				if (!ack?.success) {
					// If the server rejects, don't add optimistically
					console.warn("Chat send failed:", ack?.message);
				}
			});
		},
		[]
	);

	// Panel open/close (resets unread)
	const openPanel = useCallback(() => {
		setIsPanelOpen(true);
		setUnreadCount(0);
	}, []);

	const closePanel = useCallback(() => setIsPanelOpen(false), []);

	return {
		messages,
		unreadCount,
		sendMessage,
		openPanel,
		closePanel,
		isPanelOpen,
	};
};