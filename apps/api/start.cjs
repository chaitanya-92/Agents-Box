// Startup wrapper: runs migrations then starts the server
const { execFileSync } = require("child_process");
const path = require("path");

process.on("uncaughtException", function (err) {
  console.error("\n[FATAL] Uncaught exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", function (reason) {
  console.error("\n[WARN] Unhandled promise rejection:", reason);
});

const prismaCliPath = path.join(__dirname, "../../node_modules/.bin/prisma");
const repoRoot = path.join(__dirname, "../..");

// Retry db push up to 3 times (DB may need a moment on cold start)
function runDbPush(attempt) {
  console.log(`[startup] prisma db push (attempt ${attempt}/3)...`);
  console.log(`[startup] DIRECT_URL set: ${!!process.env.DIRECT_URL}`);
  console.log(`[startup] DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
  try {
    execFileSync(
      prismaCliPath,
      ["db", "push", "--accept-data-loss", "--skip-generate"],
      { stdio: "inherit", env: process.env, cwd: repoRoot }
    );
    console.log("[startup] ✅ Schema synced.");
    return true;
  } catch (err) {
    console.error(`[startup] ❌ db push attempt ${attempt} failed: ${err.message}`);
    if (attempt < 3) {
      console.log("[startup] Retrying in 5s...");
      const wait = Date.now() + 5000;
      while (Date.now() < wait) {} // sync sleep
      return runDbPush(attempt + 1);
    }
    console.error("[startup] All db push attempts failed — server will start but DB ops may fail");
    return false;
  }
}

runDbPush(1);

// Load the compiled server bundle
try {
  require("./dist/server.cjs");
} catch (e) {
  console.error("\n[FATAL] Server failed to load:", e.message);
  console.error(e.stack);
  process.exit(1);
}
