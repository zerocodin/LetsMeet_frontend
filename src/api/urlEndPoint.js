// base url
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// auth api url 
export const authURL = `${baseURL}/api/auth`;

// OTP api url
export const otpURL = `${baseURL}/api/otp`;

// user api url
