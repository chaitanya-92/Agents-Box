#!/usr/bin/env node
/**
 * Verifies Render service config and triggers a fresh deploy from latest commit.
 * Run AFTER: git commit && git push
 */
const API_KEY    = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const SERVICE_ID = "srv-d8tm229kh4rs73fft6l0";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  // 1. Check current service config
  console.log("🔍 Checking service config...");
  const serviceResp = await api("GET", `/services/${SERVICE_ID}`);
  const service = serviceResp.service ?? serviceResp;
  const details = service.serviceDetails ?? service.details ?? {};
  console.log(`   dockerfilePath : ${details.dockerfilePath ?? "(not set)"}`);
  console.log(`   dockerContext  : ${details.dockerContext ?? "(not set)"}`);
  console.log(`   runtime        : ${details.runtime}`);

  // 2. Patch if dockerfilePath is wrong
  if (details.dockerfilePath !== "apps/api/Dockerfile") {
    console.log(`\n🔧 Fixing dockerfilePath (was: ${details.dockerfilePath ?? "unset"})...`);
    await api("PATCH", `/services/${SERVICE_ID}`, {
      serviceDetails: {
        runtime: "docker",
        dockerfilePath: "apps/api/Dockerfile",
        dockerContext: ".",
      },
    });
    console.log("   ✅ Fixed to apps/api/Dockerfile");
  } else {
    console.log("   ✅ dockerfilePath is correct.");
  }

  // 3. Trigger fresh deploy
  console.log("\n🚀 Triggering deploy from latest commit...");
  const deploy = await api("POST", `/services/${SERVICE_ID}/deploys`, {
    clearCache: "do_not_clear",
  });
  console.log(`   ✅ Deploy triggered! ID: ${deploy.id}`);
  console.log(`\n🔗 Watch: https://dashboard.render.com/web/${SERVICE_ID}/deploys/${deploy.id}`);
  console.log(`🔗 Health: https://agentverse-api.onrender.com/api/v1/health`);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
