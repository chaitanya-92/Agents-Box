#!/usr/bin/env node
// Run: node ~/agentsstore/get-logs.mjs
// Fetches the latest deploy logs from Render
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const DIR = dirname(fileURLToPath(import.meta.url));
let secrets = {};
try {
  readFileSync(resolve(DIR, ".env.deploy"), "utf8")
    .split("\n").filter(l => l.includes("="))
    .forEach(l => { const [k,...v]=l.split("="); secrets[k.trim()]=v.join("=").trim(); });
} catch {}

const KEY = secrets.RENDER_KEY ?? "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SVC = secrets.RENDER_SVC_ID ?? "srv-d8u9obrtqb8s73b094eg";
const h = { Authorization: `Bearer ${KEY}`, Accept: "application/json" };

const r = async (path) => {
  const res = await fetch(`https://api.render.com/v1${path}`, { headers: h });
  return res.json();
};

const deploys = await r(`/services/${SVC}/deploys?limit=3`);
for (const d of deploys) {
  const dep = d.deploy ?? d;
  console.log(`\n=== Deploy ${dep.id} | ${dep.status} | ${dep.createdAt} ===`);

  // Try logs endpoint
  try {
    const logsRes = await fetch(
      `https://api.render.com/v1/services/${SVC}/logs?deployId=${dep.id}&limit=100`,
      { headers: h }
    );
    if (logsRes.ok) {
      const logs = await logsRes.json();
      (logs.logs ?? logs).forEach(l => console.log(l.timestamp, l.message ?? l));
    } else {
      console.log("  Logs endpoint:", logsRes.status, await logsRes.text().then(t => t.slice(0,100)));
    }
  } catch(e) {
    console.log("  Error fetching logs:", e.message);
  }
}
