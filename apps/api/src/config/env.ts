import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, "../../../../.env") });

// Auto-generate secrets if not provided (ephemeral — tokens invalidate on restart,
// but the server will start. Set these as persistent env vars in production.)
const autoSecret = (key: string, len = 64) => {
  if (!process.env[key] || (process.env[key]?.length ?? 0) < 32) {
    const val = randomBytes(len).toString("hex");
    process.env[key] = val;
    console.warn(`[env] ${key} not set or too short — generated ephemeral value. Set it in Render env vars for stable JWTs.`);
  }
};

autoSecret("JWT_ACCESS_SECRET");
autoSecret("JWT_REFRESH_SECRET");

if (!process.env["RAZORPAY_WEBHOOK_SECRET"]) {
  process.env["RAZORPAY_WEBHOOK_SECRET"] = randomBytes(24).toString("hex");
  console.warn("[env] RAZORPAY_WEBHOOK_SECRET not set — generated ephemeral value.");
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  CORS_ORIGIN: z.string().min(1)
});

export const env = envSchema.parse(process.env);
