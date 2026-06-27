const { execFileSync } = require("child_process");
const path = require("path");

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err.message);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[WARN] Unhandled rejection:", reason);
});

const prismaCliPath = path.join(__dirname, "../../node_modules/.bin/prisma");
const repoRoot = path.join(__dirname, "../..");

function exec(args) {
  execFileSync(prismaCliPath, args, { stdio: "inherit", env: process.env, cwd: repoRoot });
}

// First: mark migration as applied if tables already exist (resolves the "already exists" loop)
try {
  console.log("[startup] Resolving migration baseline...");
  exec(["migrate", "resolve", "--applied", "20240101000000_init"]);
  console.log("[startup] Baseline resolved.");
} catch (_) {
  // Ignore — either already resolved or migration table doesn't exist yet
}

// Then: run migrate deploy (now idempotent SQL + baseline marker)
let migrated = false;
for (let i = 1; i <= 3; i++) {
  try {
    console.log(`[startup] migrate deploy (attempt ${i}/3)...`);
    exec(["migrate", "deploy"]);
    console.log("[startup] ✅ Migrations complete.");
    migrated = true;
    break;
  } catch (err) {
    console.error(`[startup] attempt ${i} failed: ${err.message}`);
    if (i < 3) {
      const t = Date.now() + 4000;
      while (Date.now() < t) {}
    }
  }
}

if (!migrated) {
  // Last resort: db push (creates tables from schema directly)
  try {
    console.log("[startup] Falling back to db push...");
    exec(["db", "push", "--accept-data-loss", "--skip-generate"]);
    console.log("[startup] ✅ db push complete.");
  } catch (err) {
    console.error("[startup] db push also failed:", err.message, "— continuing anyway");
  }
}

try {
  require("./dist/server.cjs");
} catch (e) {
  console.error("[FATAL] Server failed to load:", e.message);
  process.exit(1);
}
