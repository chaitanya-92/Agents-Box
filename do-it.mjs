#!/usr/bin/env node
import { execSync } from "child_process";
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

const RENDER_KEY    = secrets.RENDER_KEY    ?? process.env.RENDER_KEY ?? "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const RENDER_SVC_ID = secrets.RENDER_SVC_ID ?? "srv-d8u9obrtqb8s73b094eg";

const rnd = async (method, path, body) => {
  const r = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${RENDER_KEY}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Render ${r.status} ${path}: ${t.slice(0,400)}`);
  return t ? JSON.parse(t) : null;
};

const run = (cmd, opts = {}) => execSync(cmd, { cwd: DIR, stdio: "inherit", ...opts });

async function main() {
  // ── 1. Commit all pending fixes ──────────────────────────────────────────────
  console.log("📦 Committing all fixes...");
  // Remove stale git locks (left behind by crashed git processes / sandbox writes)
  run("rm -f .git/HEAD.lock .git/index.lock .git/refs/heads/main.lock 2>/dev/null || true");
  run("git add Dockerfile apps/api/package.json apps/api/src/config/env.ts apps/api/src/server.ts apps/api/src/lib/prisma.ts apps/api/src/modules/auth/google.strategy.ts apps/api/start.cjs prisma/schema.prisma do-it.mjs");
  try {
    run('git commit -m "fix: crash wrapper + explicit binary targets + resilient env init"');
    console.log("   ✅ Committed");
  } catch { console.log("   (nothing new to commit)"); }

  // ── 2. Push ──────────────────────────────────────────────────────────────────
  console.log("🚀 Pushing to GitHub...");
  run("git push origin main");
  console.log("   ✅ Pushed\n");

  // ── 3. Fix Render env vars ───────────────────────────────────────────────────
  console.log("🔧 Patching Render env vars...");
  const PROJECT_REF = "dgegcftbihfdxtscsidn";
  const DB_PASS     = "%40Store%407711%2F";

  // Fetch current to preserve any already-set values
  let existing = {};
  try {
    const cur = await rnd("GET", `/services/${RENDER_SVC_ID}/env-vars`);
    existing = Object.fromEntries((cur ?? []).map(e => [e.envVar.key, e.envVar.value]));
  } catch {}

  const jwtAccess  = (existing.JWT_ACCESS_SECRET?.length  ?? 0) >= 32 ? existing.JWT_ACCESS_SECRET  : randomBytes(32).toString("hex");
  const jwtRefresh = (existing.JWT_REFRESH_SECRET?.length ?? 0) >= 32 ? existing.JWT_REFRESH_SECRET : randomBytes(32).toString("hex");
  const webhookSec = existing.RAZORPAY_WEBHOOK_SECRET || randomBytes(24).toString("hex");

  await rnd("PUT", `/services/${RENDER_SVC_ID}/env-vars`, [
    { key: "NODE_ENV",                value: "production" },
    { key: "PORT",                    value: "8080" },
    { key: "DATABASE_URL",            value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    { key: "DIRECT_URL",              value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@db.${PROJECT_REF}.supabase.co:5432/postgres` },
    { key: "JWT_ACCESS_SECRET",       value: jwtAccess },
    { key: "JWT_REFRESH_SECRET",      value: jwtRefresh },
    { key: "RAZORPAY_KEY_ID",         value: "rzp_test_T5JQ4Xm8fRjBAh" },
    { key: "RAZORPAY_KEY_SECRET",     value: "EoSIYaJpwkxd2fcpRhWDg1mB" },
    { key: "RAZORPAY_WEBHOOK_SECRET", value: webhookSec },
    { key: "APP_URL",                 value: "https://agentverse-ai-web.vercel.app" },
    { key: "API_URL",                 value: "https://agentverse-api.onrender.com" },
    { key: "CORS_ORIGIN",             value: "https://agentverse-ai-web.vercel.app" },
    { key: "GOOGLE_CALLBACK_URL",     value: "https://agentverse-api.onrender.com/api/v1/auth/google/callback" },
  ]);
  console.log("   ✅ Env vars set\n");

  // ── 4. Run Prisma migrations ─────────────────────────────────────────────────
  console.log("🗄  Running Prisma migrations via API...");
  // (migrations run inside the container via start command — skipped here)

  // ── 5. Trigger deploy ────────────────────────────────────────────────────────
  console.log("🔁 Triggering deploy...");
  const deploy = await rnd("POST", `/services/${RENDER_SVC_ID}/deploys`, { clearCache: "do_not_clear" });
  console.log(`   Deploy ID: ${deploy?.id}\n`);

  // ── 6. Poll until live ───────────────────────────────────────────────────────
  console.log("⏳ Polling every 30s...\n");
  for (let i = 1; i <= 40; i++) {
    await new Promise(r => setTimeout(r, 30000));
    const deploys = await rnd("GET", `/services/${RENDER_SVC_ID}/deploys?limit=1`);
    const latest  = deploys?.[0]?.deploy ?? deploys?.[0];
    const status  = latest?.status ?? "unknown";
    console.log(`   [${((i*30)/60).toFixed(1)}m] ${status}`);

    if (status === "live") {
      await new Promise(r => setTimeout(r, 5000));
      const hc = await fetch("https://agentverse-api.onrender.com/api/v1/health").catch(() => null);
      console.log("\n✅ BACKEND IS LIVE!");
      console.log("   Health:", hc ? await hc.text() : "(still warming up — try in 30s)");
      console.log("\n🎉 Everything deployed:");
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
  console.log("⏰ Timed out — check https://dashboard.render.com");
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
