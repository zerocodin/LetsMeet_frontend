import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";
import toast from "react-hot-toast";
import notificationsService from "../services/notification.Service";
import { getSocket, connectSocket } from "../lib/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
	const { isAuthenticated } = useAuth();

	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [loaded, setLoaded] = useState(false);

	// Track IDs we've already added
	const seenIdsRef = useRef(new Set());

	//  Load list from server 
	const loadNotifications = useCallback(async ({ silent = false } = {}) => {
		if (!isAuthenticated) return;
		if (!silent) setLoading(true);

		try {
			const res = await notificationsService.list({ limit: 50 });
			const items = res.data || [];

			seenIdsRef.current = new Set(items.map((n) => n._id));
			setNotifications(items);
			setUnreadCount(res.unreadCount ?? items.filter((n) => !n.isRead).length);
			setLoaded(true);
		} catch (err) {
			if (!silent) toast.error(err.message || "Failed to load notifications");
		} finally {
			if (!silent) setLoading(false);
		}
	}, [isAuthenticated]);

	//  Cheap refresh: only the count 
	const refreshCount = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const res = await notificationsService.getUnreadCount();
			setUnreadCount(res.count || 0);
		} catch {
			// silent
		}
	}, [isAuthenticated]);

	//  Add one (from socket) 
	const addNotification = useCallback((n) => {
		if (!n?._id) return;
		if (seenIdsRef.current.has(n._id)) return;

		seenIdsRef.current.add(n._id);
		setNotifications((prev) => [n, ...prev]);
		setUnreadCount((c) => c + 1);
	}, []);

	//  Mark single read 
	const markAsRead = useCallback(async (id) => {
		// Optimistic
		let wasUnread = false;
		setNotifications((prev) =>
			prev.map((n) => {
				if (n._id === id) {
					wasUnread = !n.isRead;
					return { ...n, isRead: true, readAt: new Date().toISOString() };
				}
				return n;
			})
		);
		if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

		try {
			await notificationsService.markAsRead(id);
		} catch (err) {
			toast.error(err.message || "Failed to mark as read");
			// Could roll back, but simple retry on next load is fine
		}
	}, []);

	//  Mark all read 
	const markAllAsRead = useCallback(async () => {
		const previousUnread = unreadCount;
		setNotifications((prev) =>
			prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
		);
		setUnreadCount(0);

		try {
			await notificationsService.markAllAsRead();
			toast.success("All marked as read");
		} catch (err) {
			toast.error(err.message || "Failed to mark all");
			setUnreadCount(previousUnread);
		}
	}, [unreadCount]);

	//  Remove one 
	const removeNotification = useCallback(async (id) => {
		// Optimistic
		let wasUnread = false;
		setNotifications((prev) => {
			const target = prev.find((n) => n._id === id);
			wasUnread = target && !target.isRead;
			return prev.filter((n) => n._id !== id);
		});
		if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

		try {
			await notificationsService.remove(id);
		} catch (err) {
			toast.error(err.message || "Failed to delete");
		}
	}, []);

	//  Clear read 
	const clearRead = useCallback(async () => {
		const before = notifications.length;
		setNotifications((prev) => prev.filter((n) => !n.isRead));

		try {
			const res = await notificationsService.clearRead();
			toast.success(`Cleared ${res.deletedCount || before} notification(s)`);
		} catch (err) {
			toast.error(err.message || "Failed to clear");
			// Reload on failure
			loadNotifications({ silent: true });
		}
	}, [notifications.length, loadNotifications]);

	//  On mount / auth change: load + connect socket 
	useEffect(() => {
		if (!isAuthenticated) {
			// Logged out — clear state
			setNotifications([]);
			setUnreadCount(0);
			setLoaded(false);
			seenIdsRef.current = new Set();
			return;
		}

		loadNotifications();

		// Ensure socket is connected
		const socket = connectSocket();
		if (!socket) return;

		const onNew = (n) => {
			addNotification(n);

			// Toast in-app so user sees it even without opening the panel
			toast(n.title, { icon: "🔔", duration: 3500 });

			// Small chirp — reuse existing sound helper
			try {
				const { playChirp, isSoundEnabled } = require("../lib/sound");
				if (isSoundEnabled()) playChirp("message");
			} catch {}
		};

		socket.on("notification:new", onNew);
		return () => {
			socket.off("notification:new", onNew);
		};
	}, [isAuthenticated, loadNotifications, addNotification]);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				loading,
				loaded,
				loadNotifications,
				refreshCount,
				markAsRead,
				markAllAsRead,
				removeNotification,
				clearRead,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export const useNotifications = () => {
	const ctx = useContext(NotificationContext);
	if (!ctx)
		throw new Error("useNotifications must be used within NotificationProvider");
	return ctx;
};