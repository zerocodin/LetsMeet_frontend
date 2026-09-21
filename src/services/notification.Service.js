import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
	baseURL: `${baseURL}/api/notifications`,
	withCredentials: true,
});

const notificationsService = {
	// List with optional filters
	list: async ({ unreadOnly = false, limit = 30, before } = {}) => {
		try {
			const params = { limit };
			if (unreadOnly) params.unreadOnly = "true";
			if (before) params.before = before;

			const { data } = await api.get("/", { params });
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to load notifications" };
		}
	},

	// Cheap endpoint for the badge
	getUnreadCount: async () => {
		try {
			const { data } = await api.get("/unread-count");
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to load count" };
		}
	},

	markAsRead: async (id) => {
		try {
			const { data } = await api.patch(`/${id}/read`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to mark as read" };
		}
	},

	markAllAsRead: async () => {
		try {
			const { data } = await api.patch("/read-all");
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to mark all as read" };
		}
	},

	remove: async (id) => {
		try {
			const { data } = await api.delete(`/${id}`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete" };
		}
	},

	clearRead: async () => {
		try {
			const { data } = await api.delete("/clear-read");
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to clear" };
		}
	},
};

export default notificationsService;