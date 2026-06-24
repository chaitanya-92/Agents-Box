#!/usr/bin/env node
const API_KEY = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8tm229kh4rs73fft6l0";
const PROJECT_REF = "dgegcftbihfdxtscsidn";
const PASSWORD = "%40Store%407711%2F"; // @Store@7711/ URL-encoded

const DATABASE_URL = `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
const DIRECT_URL   = `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function put(key, value) {
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
    method: "PUT",
    headers,
    body: JSON.stringify([{ key, value }]),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

// Render's PUT /env-vars replaces ALL env vars, so we fetch existing ones first
async function main() {
  console.log("🔍 Fetching existing env vars...");
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, { headers });
  const existing = await res.json();

  const updated = existing.map(e => {
    if (e.envVar.key === "DATABASE_URL") return { key: "DATABASE_URL", value: DATABASE_URL };
    if (e.envVar.key === "DIRECT_URL")   return { key: "DIRECT_URL",   value: DIRECT_URL };
    // keep generated secrets as-is (they don't expose the value, skip them)
    if (!e.envVar.value) return null;
    return { key: e.envVar.key, value: e.envVar.value };
  }).filter(Boolean);

  // Add DIRECT_URL if it wasn't already in the list
  if (!updated.find(e => e.key === "DIRECT_URL")) {
    updated.push({ key: "DIRECT_URL", value: DIRECT_URL });
  }

  console.log("📝 Updating DATABASE_URL and DIRECT_URL...");
  const putRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updated),
  });
  if (!putRes.ok) throw new Error(`PUT failed ${putRes.status}: ${await putRes.text()}`);

  console.log("✅ Env vars updated!");
  console.log(`   DATABASE_URL → postgresql://postgres.${PROJECT_REF}:***@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`);
  console.log(`   DIRECT_URL   → postgresql://postgres.${PROJECT_REF}:***@db.${PROJECT_REF}.supabase.co:5432/postgres`);

  console.log("\n🔄 Triggering redeploy...");
  const deployRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: "POST",
    headers,
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });
  if (!deployRes.ok) throw new Error(`Deploy failed: ${await deployRes.text()}`);
  const deploy = await deployRes.json();
  console.log(`✅ Deploy triggered! ID: ${deploy.id}`);
  console.log(`\n🔗 Watch build: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${deploy.id}`);
  console.log(`🔗 Health check (live in ~5 min): https://agentverse-api.onrender.com/api/v1/health`);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
