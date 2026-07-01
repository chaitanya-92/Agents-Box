#!/usr/bin/env node
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

const RENDER_KEY    = secrets.RENDER_KEY ?? "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const RENDER_SVC_ID = secrets.RENDER_SVC_ID ?? "srv-d8u9obrtqb8s73b094eg";
const VERCEL_TOKEN  = secrets.VERCEL_TOKEN;
const VERCEL_PROJ   = secrets.VERCEL_PROJECT_ID ?? "prj_VEllIgpWNTYImFEMuHxbpY8bepxx";
const VERCEL_TEAM   = secrets.VERCEL_TEAM_ID ?? "team_0VWxxugv4B1uUBvS3Dc7rFAZ";

const rnd = async (path) => {
  const r = await fetch(`https://api.render.com/v1${path}`, {
    headers: { Authorization: `Bearer ${RENDER_KEY}`, Accept: "application/json" }
  });
  return r.json();
};

// Render status
const deploys = await rnd(`/services/${RENDER_SVC_ID}/deploys?limit=1`);
const d = deploys?.[0]?.deploy ?? deploys?.[0];
console.log("🔧 Render:", d?.status ?? "unknown", d?.id ? `(${d.id.slice(0,8)})` : "");

// Health check
try {
  const hc = await fetch("https://agentverse-api.onrender.com/api/v1/health", { signal: AbortSignal.timeout(8000) });
  const body = await hc.json();
  console.log("🟢 Backend health:", body.message);
} catch { console.log("⏳ Backend not ready yet"); }

// Vercel status
if (VERCEL_TOKEN) {
  const vr = await fetch(`https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJ}&teamId=${VERCEL_TEAM}&limit=1`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  const vd = await vr.json();
  const vdep = vd?.deployments?.[0];
  console.log("🌐 Vercel:", vdep?.state ?? "unknown", vdep?.url ? `→ https://${vdep.url}` : "");
}
