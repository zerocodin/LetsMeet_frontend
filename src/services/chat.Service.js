import axios from "axios";
import { meetingURL } from "../api/urlEndPoint";

const api = axios.create({
	baseURL: meetingURL,
	withCredentials: true,
});

const chatService = {
	/**
	 * Fetch chat history for a meeting.
	 * @param {string} meetingId
	 * @param {Object} options — { before?, limit? }
	 */
	getHistory: async (meetingId, { before, limit = 50 } = {}) => {
		try {
			const params = { limit };
			if (before) params.before = before;

			const { data } = await api.get(`/${meetingId}/chat`, { params });
			return data; // { success, data, hasMore, nextCursor }
		} catch (error) {
			throw error.response?.data || { message: "Failed to load chat" };
		}
	},

	deleteMessage: async (meetingId, messageId) => {
		try {
			const { data } = await api.delete(`/${meetingId}/chat/${messageId}`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete message" };
		}
	},
};

export default chatService;