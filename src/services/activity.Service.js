import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
	baseURL: `${baseURL}/api/activity`,
	withCredentials: true,
});

const activityService = {
	getFeed: async (limit = 20) => {
		try {
			const { data } = await api.get("/", { params: { limit } });
			return data; // { success, count, data: [...] }
		} catch (error) {
			throw error.response?.data || { message: "Failed to load activity" };
		}
	},
};

export default activityService;