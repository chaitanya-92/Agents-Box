// API URL — hardcoded to avoid any stale NEXT_PUBLIC_ env var overrides from Vercel
const API_URL = "https://agentverse-api.onrender.com/api/v1";
const DEV_API  = "http://localhost:8080/api/v1";

export const publicEnv = {
  apiUrl:            process.env.NODE_ENV === "production" ? API_URL : DEV_API,
  razorpayKeyId:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  appUrl:            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  googleAuthEnabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
};
