import axios from "axios";
import { userURL } from "../api/urlEndPoint";

const api = axios.create({
  baseURL: userURL,
  withCredentials: true,
});

const userService = {
  // get profile
  getProfile: async () => {
    try {
      const { data } = await api.get("/me");
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch profile" };
    }
  },

  // update text fields
  updateProfile: async ({ name, profession, bio }) => {
    try {
      const { data } = await api.patch("/me", { name, profession, bio });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update profile" };
    }
  },

  // update profile image — uses FormData (no manual Content-Type!)
  updateAvatar: async (file) => {
    try {
      const form = new FormData();
      form.append("avatar", file);

      const { data } = await api.patch("/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to upload image" };
    }
  },

  // request email change
  requestEmailUpdate: async (newEmail, password) => {
    try {
      const { data } = await api.post("/me/email/request", {
        newEmail,
        password,
      });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to request email change" };
    }
  },

  // update password
  updatePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const { data } = await api.patch("/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update password" };
    }
  },
};

export default userService;