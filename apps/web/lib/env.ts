// NEXT_PUBLIC_ vars are baked in at build time.
// If the Vercel project has an old/wrong NEXT_PUBLIC_API_URL, ignore it
// and use the canonical production URL directly.
const PRODUCTION_API = "https://agentverse-api.onrender.com/api/v1";
const DEV_API        = "http://localhost:8080/api/v1";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const validApiUrl = rawApiUrl.includes("onrender.com") || rawApiUrl.includes("localhost")
  ? rawApiUrl
  : process.env.NODE_ENV === "production" ? PRODUCTION_API : DEV_API;

export const publicEnv = {
  apiUrl:            validApiUrl,
  razorpayKeyId:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  appUrl:            process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  googleAuthEnabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
};
