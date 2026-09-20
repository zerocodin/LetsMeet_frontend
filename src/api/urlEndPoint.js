// base url
const baseURL = import.meta.env.VITE_API_URL;

// auth api url 
export const authURL = `${baseURL}/api/auth`;

// OTP api url
export const otpURL = `${baseURL}/api/otp`;

// user api url
export const userURL = `${baseURL}/api/user`;

// meeting api url
export const meetingURL = `${baseURL}/api/meetings`;

// socket base url
export const socketURL = baseURL;