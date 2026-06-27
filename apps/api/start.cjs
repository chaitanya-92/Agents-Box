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

function runMigrations(attempt) {
  console.log(`[startup] prisma migrate deploy (attempt ${attempt}/3)...`);
  try {
    execFileSync(
      prismaCliPath,
      ["migrate", "deploy"],
      { stdio: "inherit", env: process.env, cwd: repoRoot }
    );
    console.log("[startup] ✅ Migrations complete.");
    return true;
  } catch (err) {
    console.error(`[startup] ❌ migrate deploy attempt ${attempt} failed: ${err.message}`);
    if (attempt < 3) {
      console.log("[startup] Retrying in 5s...");
      const wait = Date.now() + 5000;
      while (Date.now() < wait) {}
      return runMigrations(attempt + 1);
    }
    console.error("[startup] All migration attempts failed — server starting anyway");
    return false;
  }
}

runMigrations(1);

try {
  require("./dist/server.cjs");
} catch (e) {
  console.error("\n[FATAL] Server failed to load:", e.message);
  console.error(e.stack);
  process.exit(1);
}
