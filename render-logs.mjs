#!/usr/bin/env node
const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8tm229kh4rs73fft6l0";

const h = { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" };

async function api(path) {
  const res = await fetch(`https://api.render.com/v1${path}`, { headers: h });
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function main() {
  // Latest deploy
  const deploys = await api(`/services/${SERVICE_ID}/deploys?limit=1`);
  const deploy = deploys[0]?.deploy ?? deploys[0];
  console.log(`\n📦 Latest deploy: ${deploy?.id}`);
  console.log(`   Status : ${deploy?.status}`);
  console.log(`   Commit : ${deploy?.commit?.message ?? "unknown"}`);
  console.log(`   Started: ${deploy?.createdAt}`);

  if (deploy?.status === "live") {
    console.log("\n✅ Deploy is LIVE!");
    return;
  }

  // Fetch logs (NDJSON)
  console.log("\n📋 Build logs:\n");
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys/${deploy?.id}/logs`, { headers: h });
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  lines.slice(-80).forEach(line => {
    try {
      const obj = JSON.parse(line);
      console.log(obj.message ?? obj.text ?? obj.log ?? line);
    } catch {
      console.log(line);
    }
  });
}

main().catch(e => console.error("❌", e.message));
