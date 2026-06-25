#!/usr/bin/env node
// Secrets read from .env.deploy (gitignored) so GitHub push protection doesn't block
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const DIR = dirname(fileURLToPath(import.meta.url));

// Load .env.deploy
let secrets = {};
try {
  readFileSync(resolve(DIR, ".env.deploy"), "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .forEach(l => { const [k, ...v] = l.split("="); secrets[k.trim()] = v.join("=").trim(); });
} catch { /* file not required */ }

const RENDER_KEY     = secrets.RENDER_KEY     ?? process.env.RENDER_KEY;
const RENDER_SVC_ID  = secrets.RENDER_SVC_ID  ?? process.env.RENDER_SVC_ID ?? "srv-d8u9obrtqb8s73b094eg";

if (!RENDER_KEY) throw new Error("Missing RENDER_KEY — check .env.deploy");

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

const run = (cmd) => execSync(cmd, { cwd: DIR, stdio: "inherit" });

async function main() {
  // ── 1. Commit & push ────────────────────────────────────────────────────────
  console.log("📦 Committing and pushing...");
  run("git add -f Dockerfile do-it.mjs .gitignore apps/api/src/modules/auth/google.strategy.ts 2>/dev/null || true");
  try {
    run(`git commit -m "fix: TS type error in google.strategy (UserRole cast) + Dockerfile debian slim"`);
    run("git push origin main");
    console.log("   ✅ Pushed\n");
  } catch { console.log("   Already up to date\n"); }

  // ── 2. Trigger deploy ────────────────────────────────────────────────────────
  console.log("🔁 Triggering Render deploy...");
  const deploy = await rnd("POST", `/services/${RENDER_SVC_ID}/deploys`, { clearCache: "do_not_clear" });
  console.log(`   Deploy ID: ${deploy?.id ?? JSON.stringify(deploy)}\n`);

  // ── 3. Poll until live ───────────────────────────────────────────────────────
  console.log("⏳ Polling every 30s...\n");
  for (let i = 1; i <= 30; i++) {
    await new Promise(res => setTimeout(res, 30000));
    const deploys = await rnd("GET", `/services/${RENDER_SVC_ID}/deploys?limit=1`);
    const latest  = deploys?.[0]?.deploy ?? deploys?.[0];
    const status  = latest?.status ?? "unknown";
    console.log(`   [${((i*30)/60).toFixed(1)}m] ${status}`);

    if (status === "live") {
      const hc = await fetch("https://agentverse-api.onrender.com/api/v1/health").catch(() => null);
      console.log("\n✅ BACKEND LIVE!");
      console.log("   Health:", hc ? await hc.text() : "(cold start — try in 20s)");
      console.log("\n🎉 All done:");
      console.log("   🌐  https://agentverse-ai-web.vercel.app");
      console.log("   🔗  https://agentverse-api.onrender.com/api/v1/health");
      console.log("   🔐  https://agentverse-ai-web.vercel.app/login");
      return;
    }

    if (["build_failed","update_failed","canceled"].includes(status)) {
      const ev = await rnd("GET", `/services/${RENDER_SVC_ID}/events?limit=5`).catch(() => []);
      console.log(`\n❌ Build failed. Events:`);
      (ev ?? []).forEach(e => console.log("  ", JSON.stringify(e?.event ?? e)));
      process.exit(1);
    }
  }
  console.log("⏰ Timed out — check https://dashboard.render.com");
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
