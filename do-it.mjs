#!/usr/bin/env node
import { execSync } from "child_process";

const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8tm229kh4rs73fft6l0";
const h = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", Accept: "application/json" };

const call = async (method, path, body) => {
  const r = await fetch(`https://api.render.com/v1${path}`, {
    method, headers: h, body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
};

const run = (cmd) => execSync(cmd, { cwd: new URL(".", import.meta.url).pathname, stdio: "inherit" });

async function main() {
  // 1. Commit root Dockerfile and push
  console.log("📦 Committing root Dockerfile and pushing...");
  run("git add Dockerfile do-it.mjs");
  try { run(`git commit -m "fix: add root Dockerfile for Render auto-detection"`); }
  catch { console.log("   Nothing new to commit, continuing..."); }
  run("git push origin main");
  console.log("   ✅ Pushed\n");

  // 2. Trigger deploy
  console.log("🚀 Triggering Render deploy...");
  const r = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: "POST", headers: h, body: JSON.stringify({ clearCache: "clear" })
  });
  const t = await r.text();
  const dep = t ? JSON.parse(t) : null;
  const depId = dep?.id ?? dep?.deploy?.id ?? "?";
  console.log(`   Deploy ID: ${depId}  (HTTP ${r.status})\n`);

  // 3. Poll every 20s until live or failed
  console.log("⏳ Waiting for build (polls every 20s)...\n");
  for (let i = 1; i <= 30; i++) {
    await new Promise(res => setTimeout(res, 20000));
    const deploys = await call("GET", `/services/${SERVICE_ID}/deploys?limit=1`);
    const latest  = deploys?.[0]?.deploy ?? deploys?.[0];
    const status  = latest?.status ?? "unknown";
    console.log(`   [${i * 20}s] ${status}`);

    if (status === "live") {
      console.log("\n✅ BACKEND IS LIVE!");
      console.log("   🔗 https://agentverse-api.onrender.com/api/v1/health\n");
      console.log("🎉 ALL DONE");
      console.log("   Frontend → https://agentverse-ai-web.vercel.app");
      console.log("   Backend  → https://agentverse-api.onrender.com/api/v1/health");
      return;
    }
    if (["build_failed","update_failed","canceled","deactivated"].includes(status)) {
      console.log(`\n❌ Build failed (${status}).`);
      const lr = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys/${latest?.id}/logs`, { headers: h });
      const lt = await lr.text();
      lt.trim().split("\n").slice(-50).forEach(line => {
        try { console.log(JSON.parse(line).message ?? line); } catch { console.log(line); }
      });
      process.exit(1);
    }
  }
  console.log("\n⏰ Timed out after 10 min.");
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
