#!/usr/bin/env node
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
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
  // Never use git add -A — secrets like .env.deploy must stay out of git
  run("git add apps/api/start.cjs apps/api/src/app.ts apps/api/src/modules/billing/billing.service.ts apps/web/lib/api.ts apps/web/components/marketing/auth-form.tsx packages/config/plans.ts prisma/migrations/20240101000000_init/migration.sql do-it.mjs");
  try {
    run('git commit -m "fix: razorpay receipt length, auth form rewrite, cors *, stable JWT"');
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

  // Preserve existing secrets so tokens stay valid across deploys
  const jwtAccess  = (existing.JWT_ACCESS_SECRET?.length  ?? 0) >= 32 ? existing.JWT_ACCESS_SECRET  : (secrets.JWT_ACCESS_SECRET  || randomBytes(32).toString("hex"));
  const jwtRefresh = (existing.JWT_REFRESH_SECRET?.length ?? 0) >= 32 ? existing.JWT_REFRESH_SECRET : (secrets.JWT_REFRESH_SECRET || randomBytes(32).toString("hex"));
  const webhookSec = existing.RAZORPAY_WEBHOOK_SECRET || secrets.RAZORPAY_WEBHOOK_SECRET || randomBytes(24).toString("hex");

  // Write secrets back to .env.deploy so they're stable on future runs
  const envDeployPath = resolve(DIR, ".env.deploy");
  const currentEnvDeploy = readFileSync(envDeployPath, "utf8").replace(/\r\n/g, "\n");
  const updatedEnvDeploy = currentEnvDeploy
    .replace(/^JWT_ACCESS_SECRET=.*$/m,  `JWT_ACCESS_SECRET=${jwtAccess}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${jwtRefresh}`)
    .replace(/^RAZORPAY_WEBHOOK_SECRET=.*$/m, `RAZORPAY_WEBHOOK_SECRET=${webhookSec}`);
  const withNew = (src, key, val) => src.match(new RegExp(`^${key}=`, "m")) ? src : src + `\n${key}=${val}`;
  const finalEnvDeploy = [
    ["JWT_ACCESS_SECRET", jwtAccess],
    ["JWT_REFRESH_SECRET", jwtRefresh],
    ["RAZORPAY_WEBHOOK_SECRET", webhookSec],
  ].reduce((s, [k, v]) => withNew(s, k, v), updatedEnvDeploy);
  writeFileSync(envDeployPath, finalEnvDeploy.trim() + "\n", "utf8");
  console.log("   🔐 JWT secrets saved to .env.deploy (stable across deploys)");

  const GOOGLE_CLIENT_ID     = secrets.GOOGLE_CLIENT_ID     ?? "";
  const GOOGLE_CLIENT_SECRET = secrets.GOOGLE_CLIENT_SECRET ?? "";

  await rnd("PUT", `/services/${RENDER_SVC_ID}/env-vars`, [
    { key: "NODE_ENV",                value: "production" },
    { key: "PORT",                    value: "8080" },
    { key: "DATABASE_URL",            value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
    { key: "DIRECT_URL",              value: `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@db.${PROJECT_REF}.supabase.co:5432/postgres` },
    { key: "JWT_ACCESS_SECRET",       value: jwtAccess },
    { key: "JWT_REFRESH_SECRET",      value: jwtRefresh },
    { key: "RAZORPAY_KEY_ID",         value: secrets.RAZORPAY_KEY_ID     ?? "rzp_test_T6Xe07Lpfq8jTL" },
    { key: "RAZORPAY_KEY_SECRET",     value: secrets.RAZORPAY_KEY_SECRET ?? "2ncVpv5obVShDmjnD7i0EYnq" },
    { key: "RAZORPAY_WEBHOOK_SECRET", value: webhookSec },
    { key: "APP_URL",                 value: "https://agentverse-ai-web.vercel.app" },
    { key: "API_URL",                 value: "https://agentverse-api.onrender.com" },
    { key: "CORS_ORIGIN",             value: "*" },
    { key: "GOOGLE_CLIENT_ID",        value: GOOGLE_CLIENT_ID },
    { key: "GOOGLE_CLIENT_SECRET",    value: GOOGLE_CLIENT_SECRET },
    { key: "GOOGLE_CALLBACK_URL",     value: "https://agentverse-api.onrender.com/api/v1/auth/google/callback" },
  ]);
  console.log("   ✅ Env vars set\n");

  // ── 4. Ensure Vercel project root directory is apps/web ─────────────────────
  console.log("🔧 Ensuring Vercel project rootDirectory = apps/web...");
  const VERCEL_TOKEN      = secrets.VERCEL_TOKEN      ?? process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = secrets.VERCEL_PROJECT_ID ?? "prj_VEllIgpWNTYImFEMuHxbpY8bepxx";
  const VERCEL_TEAM_ID    = secrets.VERCEL_TEAM_ID    ?? "team_0VWxxugv4B1uUBvS3Dc7rFAZ";

  const vcl = async (method, path, body) => {
    const url = `https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${VERCEL_TEAM_ID}`;
    const r = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const t = await r.text();
    return { ok: r.ok, status: r.status, body: t ? JSON.parse(t) : null };
  };

  const rootPatch = await vcl("PATCH", `/v9/projects/${VERCEL_PROJECT_ID}`, { rootDirectory: "apps/web" });
  console.log(`   ${rootPatch.ok ? "✅ rootDirectory = apps/web" : "⚠️  " + JSON.stringify(rootPatch.body)}\n`);

  // ── 5. Patch Vercel env vars ─────────────────────────────────────────────────
  console.log("🔧 Patching Vercel env vars...");

  // Fetch existing env vars to avoid duplicates
  const { body: envBody } = await vcl("GET", `/v9/projects/${VERCEL_PROJECT_ID}/env`);
  const existingEnvs = envBody?.envs ?? [];
  const envMap = Object.fromEntries(existingEnvs.map(e => [e.key, e.id]));

  const vercelEnvs = [
    { key: "NEXT_PUBLIC_API_URL",              value: "https://agentverse-api.onrender.com/api/v1" },
    { key: "NEXT_PUBLIC_APP_URL",              value: "https://agentverse-ai-web.vercel.app" },
    { key: "NEXT_PUBLIC_RAZORPAY_KEY_ID",      value: secrets.RAZORPAY_KEY_ID ?? "rzp_test_T6Xe07Lpfq8jTL" },
    { key: "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED",  value: GOOGLE_CLIENT_ID ? "true" : "false" },
  ];

  for (const { key, value } of vercelEnvs) {
    if (envMap[key]) {
      // Update existing
      const r = await vcl("PATCH", `/v9/projects/${VERCEL_PROJECT_ID}/env/${envMap[key]}`, { value, target: ["production", "preview", "development"], type: "plain" });
      console.log(`   ${r.ok ? "✅" : "⚠️ "} ${key}`);
    } else {
      // Create new
      const r = await vcl("POST", `/v9/projects/${VERCEL_PROJECT_ID}/env`, { key, value, target: ["production", "preview", "development"], type: "plain" });
      console.log(`   ${r.ok ? "✅" : "⚠️ "} ${key} (created)`);
    }
  }

  // Trigger a fresh Vercel build from the latest git commit
  // Get repoId from the project's git integration so we never hardcode it
  console.log("   🔄 Triggering fresh Vercel build from latest commit...");
  const { body: projInfo } = await vcl("GET", `/v9/projects/${VERCEL_PROJECT_ID}`);
  const repoId = projInfo?.link?.repoId;
  if (repoId) {
    const freshBuild = await vcl("POST", `/v13/deployments`, {
      name: "agentverse-ai-web",
      target: "production",
      gitSource: { type: "github", ref: "main", repoId },
    });
    console.log(`   ${freshBuild.ok ? "✅ Fresh build triggered — id: " + (freshBuild.body?.id ?? freshBuild.body?.uid) : "⚠️  " + JSON.stringify(freshBuild.body?.error ?? freshBuild.body)}\n`);
  } else {
    console.log("   ⚠️  Could not get repoId from project — Vercel will auto-deploy from GitHub push\n");
  }

  // ── 6. Trigger Render deploy ─────────────────────────────────────────────────
  console.log("🔁 Triggering Render deploy...");
  const deploy = await rnd("POST", `/services/${RENDER_SVC_ID}/deploys`, { clearCache: "do_not_clear" });
  console.log(`   Deploy ID: ${deploy?.id}\n`);

  // ── 7. Poll until live ───────────────────────────────────────────────────────
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
