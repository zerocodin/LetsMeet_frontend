import axios from "axios";
import { otpURL } from "../api/urlEndPoint";

const api = axios.create({
  baseURL: otpURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const otpService = {
  send: async (email) => {
    try {
      const { data } = await api.post("/send", { email });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to send OTP" };
    }
  },

  verify: async (email, otp) => {
    try {
      const { data } = await api.post("/verify", { email, otp });
      return data;
    } catch (error) {
      throw error.response?.data || { message: "Invalid OTP" };
    }
  },
};

export default otpService;