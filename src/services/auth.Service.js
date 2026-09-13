import axios from "axios";
import { authURL } from "../api/urlEndPoint";

const api = axios.create({
	baseURL: authURL,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

const authService = {
	register: async (userData) => {
		try {
			const response = await api.post("/register", userData);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Registration failed" };
		}
	},

	login: async (credentials) => {
		try {
			const response = await api.post("/login", credentials);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Login failed" };
		}
	},

	logout: async () => {
		try {
			const response = await api.post("/logout");
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Logout failed" };
		}
	},

	resetPassword: async (data) => {
		try {
			const response = await api.put("/reset-password", data);
			return response.data;
		} catch (error) {
			throw error.response?.data || { message: "Password reset failed" };
		}
	},

	getMe: async () => {
		try {
			const { data } = await api.get("/me");
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to fetch profile" };
		}
	},

	deleteUnverified: async (email) => {
		try {
			const { data } = await api.delete("/delete-1", { data: { email } });
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete account" };
		}
	},

	deleteVerified: async ({ email, password }) => {
		try {
			const { data } = await api.delete("/delete-2", {
				data: { email, password },
			});
			return data;
		} catch (error) {
			throw error.response?.data || { message: "Failed to delete account" };
		}
	},
};

export default authService;
