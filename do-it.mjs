#!/usr/bin/env node
import { execSync } from "child_process";

const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8tn95ojs32c73bv36jg";

const h = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", Accept: "application/json" };
const DIR = new URL(".", import.meta.url).pathname;

const call = async (method, path, body) => {
  const r = await fetch(`https://api.render.com/v1${path}`, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Render ${r.status} ${path}: ${t.slice(0,300)}`);
  return t ? JSON.parse(t) : null;
};

const run = (cmd) => execSync(cmd, { cwd: DIR, stdio: "inherit" });

async function main() {
  // 1. Commit package-lock.json + .gitignore fix so Render gets a stable lockfile
  console.log("📦 Committing package-lock.json (enables npm ci on Render)...");
  run("git add package-lock.json .gitignore do-it.mjs");
  try {
    run(`git commit -m "fix: commit lockfile + use npm ci for reproducible Render builds"`);
    run("git push origin main");
    console.log("   ✅ Pushed\n");
  } catch {
    console.log("   Nothing new to push, continuing...\n");
  }

  // 2. Patch build command to use npm ci (always installs devDeps, uses exact lockfile)
  console.log("🔧 Patching Render build command → npm ci ...");
  await call("PATCH", `/services/${SERVICE_ID}`, {
    serviceDetails: {
      runtime: "node",
      envSpecificDetails: {
        buildCommand: [
          "npm ci",
          "node_modules/.bin/tsc -p packages/config/tsconfig.json",
          "node_modules/.bin/prisma generate",
          "node_modules/.bin/tsc -p apps/api/tsconfig.json",
          "node_modules/.bin/tsc-alias -p apps/api/tsconfig.json"
        ].join(" && "),
        startCommand: "node apps/api/dist/server.js",
      },
    },
  });
  console.log("   ✅ Patched\n");

  // 3. Trigger deploy with clear cache
  console.log("🚀 Triggering deploy...");
  const r = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: "POST", headers: h, body: JSON.stringify({ clearCache: "clear" })
  });
  const dep = r.status !== 204 ? JSON.parse(await r.text()) : {};
  console.log(`   Deploy ID: ${dep?.id ?? "triggered"}  (HTTP ${r.status})\n`);

  // 4. Poll
  console.log("⏳ Polling every 20s...\n");
  for (let i = 1; i <= 45; i++) {
    await new Promise(res => setTimeout(res, 20000));
    const deploys = await call("GET", `/services/${SERVICE_ID}/deploys?limit=1`);
    const latest  = deploys?.[0]?.deploy ?? deploys?.[0];
    const status  = latest?.status ?? "unknown";
    console.log(`   [${i * 20}s] ${status}`);

    if (status === "live") {
      console.log("\n✅ BACKEND IS LIVE!");
      try {
        const hc = await fetch("https://agentverse-api.onrender.com/api/v1/health");
        console.log("   Health:", await hc.text());
      } catch {}
      console.log("\n🎉 BOTH SERVICES LIVE");
      console.log("   Frontend → https://agentverse-ai-web.vercel.app");
      console.log("   Backend  → https://agentverse-api.onrender.com/api/v1/health");
      return;
    }

    if (["build_failed","update_failed","canceled","deactivated"].includes(status)) {
      console.log(`\n❌ Build failed (status: ${status}).`);
      // Fetch events for last error
      const ev = await call("GET", `/services/${SERVICE_ID}/events?limit=5`).catch(() => null);
      if (ev) {
        const lastFail = ev.find?.(e => e.event?.type === "build_ended");
        console.log("   Last event:", JSON.stringify(lastFail?.event?.details ?? {}, null, 2));
      }
      process.exit(1);
    }
  }
  console.log("\n⏰ Timed out.");
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
