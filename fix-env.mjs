#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const DIR = dirname(fileURLToPath(import.meta.url));
let secrets = {};
try {
  readFileSync(resolve(DIR, ".env.deploy"), "utf8")
    .split("\n").filter(l => l.includes("="))
    .forEach(l => { const [k,...v]=l.split("="); secrets[k.trim()]=v.join("=").trim(); });
} catch {}

const RENDER_KEY    = secrets.RENDER_KEY    ?? process.env.RENDER_KEY;
const RENDER_SVC_ID = secrets.RENDER_SVC_ID ?? "srv-d8u9obrtqb8s73b094eg";

const rnd = async (method, path, body) => {
  const r = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${RENDER_KEY}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t.slice(0,300)}`);
  return t ? JSON.parse(t) : null;
};

async function main() {
  console.log("🔍 Checking current env vars on Render service...");
  const current = await rnd("GET", `/services/${RENDER_SVC_ID}/env-vars`);
  const existing = Object.fromEntries((current ?? []).map(e => [e.envVar.key, e.envVar.value]));

  console.log("   Existing keys:", Object.keys(existing).join(", ") || "(none)");

  // Build the correct env var set — all required by envSchema
  const PROJECT_REF = "dgegcftbihfdxtscsidn";
  const DB_PASS     = "%40Store%407711%2F";

  const envVars = [
    { key: "NODE_ENV",                value: "production" },
    { key: "PORT",                    value: "8080" },
    { key: "DATABASE_URL",            value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    { key: "DIRECT_URL",              value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@db.${PROJECT_REF}.supabase.co:5432/postgres` },
    { key: "JWT_ACCESS_SECRET",       value: existing.JWT_ACCESS_SECRET?.length >= 32 ? existing.JWT_ACCESS_SECRET : randomBytes(32).toString("hex") },
    { key: "JWT_REFRESH_SECRET",      value: existing.JWT_REFRESH_SECRET?.length >= 32 ? existing.JWT_REFRESH_SECRET : randomBytes(32).toString("hex") },
    { key: "RAZORPAY_KEY_ID",         value: "rzp_test_T5JQ4Xm8fRjBAh" },
    { key: "RAZORPAY_KEY_SECRET",     value: "EoSIYaJpwkxd2fcpRhWDg1mB" },
    { key: "RAZORPAY_WEBHOOK_SECRET", value: existing.RAZORPAY_WEBHOOK_SECRET || randomBytes(24).toString("hex") },
    { key: "APP_URL",                 value: "https://agentverse-ai-web.vercel.app" },
    { key: "API_URL",                 value: "https://agentverse-api.onrender.com" },
    { key: "CORS_ORIGIN",             value: "https://agentverse-ai-web.vercel.app" },
    { key: "GOOGLE_CALLBACK_URL",     value: "https://agentverse-api.onrender.com/api/v1/auth/google/callback" },
  ];

  console.log("\n📝 Patching env vars (PUT all at once)...");
  await rnd("PUT", `/services/${RENDER_SVC_ID}/env-vars`, envVars);
  console.log("   ✅ Env vars updated");

  // Trigger deploy
  console.log("\n🔁 Triggering deploy with correct env vars...");
  const deploy = await rnd("POST", `/services/${RENDER_SVC_ID}/deploys`, { clearCache: "do_not_clear" });
  console.log(`   Deploy ID: ${deploy?.id}`);

  // Poll
  console.log("\n⏳ Polling every 30s...\n");
  for (let i = 1; i <= 30; i++) {
    await new Promise(r => setTimeout(r, 30000));
    const deploys = await rnd("GET", `/services/${RENDER_SVC_ID}/deploys?limit=1`);
    const latest  = deploys?.[0]?.deploy ?? deploys?.[0];
    const status  = latest?.status ?? "unknown";
    console.log(`   [${((i*30)/60).toFixed(1)}m] ${status}`);

    if (status === "live") {
      const hc = await fetch("https://agentverse-api.onrender.com/api/v1/health").catch(() => null);
      console.log("\n✅ BACKEND LIVE!");
      console.log("   Health:", hc ? await hc.text() : "(warmup — try in 20s)");
      console.log("\n🎉 Fully deployed:");
      console.log("   🌐  https://agentverse-ai-web.vercel.app");
      console.log("   🔗  https://agentverse-api.onrender.com/api/v1/health");
      console.log("   🔐  https://agentverse-ai-web.vercel.app/login");
      console.log("   📝  https://agentverse-ai-web.vercel.app/register");
      return;
    }

    if (["build_failed","update_failed","canceled"].includes(status)) {
      const ev = await rnd("GET", `/services/${RENDER_SVC_ID}/events?limit=5`).catch(() => []);
      console.log("❌ Failed. Events:");
      (ev ?? []).forEach(e => console.log("  ", JSON.stringify(e?.event ?? e)));
      process.exit(1);
    }
  }
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
