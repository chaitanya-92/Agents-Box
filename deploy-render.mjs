#!/usr/bin/env node
/**
 * One-shot Render deployment script for agentverse-api
 * Run: node deploy-render.mjs
 */

const API_KEY = "rnd_JpCG81whZjCm9n8g5IBp09tqRsnF";
const GITHUB_REPO = "https://github.com/chaitanya-92/Agents-Box";
const SERVICE_NAME = "agentverse-api";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Render API ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log("🔍 Fetching Render owner ID...");
  const owners = await api("GET", "/owners?limit=1");
  const ownerId = owners[0]?.owner?.id;
  if (!ownerId) throw new Error("Could not find Render owner. Check API key.");
  console.log(`   Owner: ${owners[0].owner.email} (${ownerId})`);

  // Check if service already exists
  console.log("\n🔍 Checking for existing service...");
  const existing = await api("GET", `/services?name=${SERVICE_NAME}&limit=5`);
  const existingService = existing.find(s => s.service?.name === SERVICE_NAME);

  if (existingService) {
    const svc = existingService.service;
    console.log(`\n✅ Service already exists: ${svc.serviceDetails?.url}`);
    console.log("   Triggering a new deploy...");
    await api("POST", `/services/${svc.id}/deploys`, { clearCache: "do_not_clear" });
    console.log("   Deploy triggered!");
    console.log(`\n🔗 API URL: ${svc.serviceDetails?.url}/api/v1/health`);
    return;
  }

  // Read DATABASE_URL from .env
  let dbUrl = process.env.DATABASE_URL;
  let directUrl = process.env.DIRECT_URL;
  if (!dbUrl) {
    try {
      const { readFileSync } = await import("fs");
      const env = readFileSync(new URL(".env", import.meta.url), "utf8");
      dbUrl = env.match(/^DATABASE_URL="?(.+?)"?$/m)?.[1];
      directUrl = env.match(/^DIRECT_URL="?(.+?)"?$/m)?.[1];
    } catch {}
  }

  if (!dbUrl || dbUrl.includes("PROJECT_REF")) {
    console.warn("\n⚠️  DATABASE_URL still has PROJECT_REF placeholder.");
    console.warn("   You MUST set DATABASE_URL in the Render dashboard after deploy.");
    dbUrl = "postgresql://placeholder:placeholder@placeholder/placeholder";
  }

  console.log("\n🚀 Creating Render service...");
  const payload = {
    type: "web_service",
    name: SERVICE_NAME,
    ownerId,
    repo: GITHUB_REPO,
    branch: "main",
    rootDir: ".",
    autoDeploy: "yes",
    serviceDetails: {
      runtime: "docker",
      dockerfilePath: "apps/api/Dockerfile",
      dockerContext: ".",
      plan: "free",
      region: "singapore",
      healthCheckPath: "/api/v1/health",
      numInstances: 1,
      pullRequestPreviewsEnabled: "no",
    },
    envVars: [
      { key: "NODE_ENV",            value: "production" },
      { key: "PORT",                value: "8080" },
      { key: "DATABASE_URL",        value: dbUrl },
      ...(directUrl ? [{ key: "DIRECT_URL", value: directUrl }] : []),
      { key: "APP_URL",             value: "https://agentverse-ai-web.vercel.app" },
      { key: "API_URL",             value: "https://agentverse-api.onrender.com" },
      { key: "CORS_ORIGIN",         value: "https://agentverse-ai-web.vercel.app" },
      { key: "GOOGLE_CALLBACK_URL", value: "https://agentverse-api.onrender.com/api/v1/auth/google/callback" },
      { key: "RAZORPAY_KEY_ID",     value: "rzp_test_T5JQ4Xm8fRjBAh" },
      { key: "RAZORPAY_KEY_SECRET", value: "EoSIYaJpwkxd2fcpRhWDg1mB" },
      { key: "RAZORPAY_WEBHOOK_SECRET", generateValue: true },
      { key: "JWT_ACCESS_SECRET",   generateValue: true },
      { key: "JWT_REFRESH_SECRET",  generateValue: true },
    ],
  };

  const result = await api("POST", "/services", payload);
  const svc = result.service;

  console.log(`\n✅ Service created!`);
  console.log(`   Name:   ${svc.name}`);
  console.log(`   ID:     ${svc.id}`);
  console.log(`   Status: ${svc.suspended}`);
  console.log(`\n🔗 API URL (live in ~5 min): https://agentverse-api.onrender.com/api/v1/health`);
  console.log(`\n⚠️  Still need to set in Render dashboard → ${svc.name} → Environment:`);
  console.log(`   DATABASE_URL  — your Supabase URL (replace PROJECT_REF)`);
  console.log(`   DIRECT_URL    — your Supabase direct URL`);
  console.log(`\n   Dashboard: https://dashboard.render.com/web/${svc.id}/env`);
}

main().catch(e => { console.error("\n❌", e.message); process.exit(1); });
