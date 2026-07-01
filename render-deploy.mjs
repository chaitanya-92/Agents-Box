#!/usr/bin/env node
const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8u9obrtqb8s73b094eg";
const h = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function main() {
  // 1. Trigger deploy
  console.log("🚀 Triggering deploy...");
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: "POST", headers: h,
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });
  console.log(`   HTTP ${res.status}`);
  const body = await res.text();
  let deployId;
  if (body) {
    try {
      const d = JSON.parse(body);
      // Render wraps it: { id, deploy: { id, status, ... } } or just { id, status }
      deployId = d.id ?? d.deploy?.id;
      console.log(`   Deploy ID: ${deployId}`);
      console.log(`   Initial status: ${d.status ?? d.deploy?.status ?? "triggered"}`);
    } catch { console.log("   Body:", body.slice(0, 200)); }
  }

  // 2. Poll status every 15s for up to 12 min
  console.log("\n⏳ Polling status (every 15s, up to 12 min)...\n");
  for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 15000));
    try {
      const r2 = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=1`, { headers: h });
      const raw = await r2.text();
      const deploys = JSON.parse(raw);
      // Try both shapes: [{deploy:{...}}] and [{id,status,...}]
      const item = Array.isArray(deploys) ? deploys[0] : deploys;
      const latest = item?.deploy ?? item;
      const status = latest?.status ?? "unknown";
      const elapsed = ((i + 1) * 15);
      process.stdout.write(`   [${elapsed}s] ${status}\n`);

      if (status === "live") {
        console.log("\n✅ LIVE! https://agentverse-api.onrender.com/api/v1/health");
        return;
      }
      if (["build_failed", "update_failed", "canceled", "deactivated"].includes(status)) {
        console.log(`\n❌ Deploy failed: ${status}`);
        console.log("   Check Render dashboard → Logs for details.");
        process.exit(1);
      }
    } catch (e) {
      console.log(`   [poll error] ${e.message}`);
    }
  }
  console.log("\n⏰ Timed out. Check https://dashboard.render.com for status.");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
