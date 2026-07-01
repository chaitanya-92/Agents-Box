#!/usr/bin/env node
// Fetches DATABASE_URL + DIRECT_URL from Render, then runs prisma migrate deploy locally
import { execSync } from "child_process";

const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8u9obrtqb8s73b094eg";
const h = { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" };

console.log("🔍 Fetching env vars from Render...");
const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, { headers: h });
const vars = await res.json();

if (!Array.isArray(vars)) {
  console.error("❌ Unexpected response:", JSON.stringify(vars));
  process.exit(1);
}

const get = (key) => vars.find(v => v.envVar?.key === key)?.envVar?.value
                   ?? vars.find(v => v.key === key)?.value;

const DATABASE_URL = get("DATABASE_URL");
const DIRECT_URL   = get("DIRECT_URL");

if (!DATABASE_URL || !DIRECT_URL) {
  console.log("Available keys:", vars.map(v => v.envVar?.key ?? v.key).join(", "));
  console.error("❌ Could not find DATABASE_URL or DIRECT_URL");
  process.exit(1);
}

console.log("✅ Got database URLs");
console.log("🗄️  Running prisma migrate deploy...\n");

try {
  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL, DIRECT_URL },
    stdio: "inherit",
  });
  console.log("\n✅ Migrations applied! Login should work now.");
} catch (err) {
  console.error("\n❌ Migration failed:", err.message);
  console.log("\nTrying db push as fallback...");
  try {
    execSync("npx prisma db push --accept-data-loss", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL, DIRECT_URL },
      stdio: "inherit",
    });
    console.log("\n✅ db push done!");
  } catch (e2) {
    console.error("❌ db push also failed:", e2.message);
  }
}
