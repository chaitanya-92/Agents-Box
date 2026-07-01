import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { z } from "zod";

// Load .env if present (dev only; Render injects vars directly)
dotenv.config();

// Ensure secrets exist with minimum length
const ensureSecret = (key: string, bytes = 32) => {
  if (!process.env[key] || process.env[key]!.length < 32) {
    process.env[key] = randomBytes(bytes).toString("hex");
  }
};
ensureSecret("JWT_ACCESS_SECRET");
ensureSecret("JWT_REFRESH_SECRET");
if (!process.env["RAZORPAY_WEBHOOK_SECRET"]) {
  process.env["RAZORPAY_WEBHOOK_SECRET"] = randomBytes(24).toString("hex");
}

const envSchema = z.object({
  NODE_ENV:                  z.enum(["development", "test", "production"]).default("development"),
  PORT:                      z.coerce.number().default(8080),
  DATABASE_URL:              z.string().default("postgresql://localhost:5432/agentverse"),
  DIRECT_URL:                z.string().optional(),
  JWT_ACCESS_SECRET:         z.string().min(1),
  JWT_REFRESH_SECRET:        z.string().min(1),
  GOOGLE_CLIENT_ID:          z.string().optional(),
  GOOGLE_CLIENT_SECRET:      z.string().optional(),
  GOOGLE_CALLBACK_URL:       z.string().optional(),
  RAZORPAY_KEY_ID:           z.string().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET:       z.string().default("placeholder"),
  RAZORPAY_WEBHOOK_SECRET:   z.string().min(1),
  APP_URL:                   z.string().default("http://localhost:3000"),
  API_URL:                   z.string().default("http://localhost:8080"),
  CORS_ORIGIN:               z.string().default("*"),
  // Email via Resend (https://resend.com — add RESEND_API_KEY to Render env vars)
  RESEND_API_KEY:            z.string().optional(),
  EMAIL_FROM:                z.string().default("AgentVerse AI <noreply@agentverse.ai>"),
});

export const env = envSchema.parse(process.env);
