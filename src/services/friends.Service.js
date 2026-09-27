import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
	baseURL: `${baseURL}/api/friends`,
	withCredentials: true,
});

const friendsService = {
	getFriends: async () => {
		try {
			const { data } = await api.get("/");
			return data; 
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch friends" };
		}
	},

	getRequests: async () => {
		try {
			const { data } = await api.get("/requests");
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch requests" };
		}
	},

	searchUsers: async (q) => {
		try {
			const { data } = await api.get("/search", { params: { q } });
			return data; 
		} catch (error) {
			throw error.response?.data || { message: "Search failed" };
		}
	},

	sendRequest: async (identifier, message = "") => {
		try {
			const { data } = await api.post("/request", { identifier, message });
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to send request" };
		}
	},

	respond: async (requestId, action) => {
		try {
			const { data } = await api.patch(`/request/${requestId}`, { action });
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to respond" };
		}
	},

	removeFriend: async (friendId) => {
		try {
			const { data } = await api.delete(`/${friendId}`);
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to remove friend" };
		}
	},
};

export default friendsService;