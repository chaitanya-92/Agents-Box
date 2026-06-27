// Startup wrapper: runs migrations then starts the server
const { execFileSync } = require("child_process");
const path = require("path");

// Crash on truly fatal errors (bad imports, etc.)
process.on("uncaughtException", function (err) {
  console.error("\n[FATAL] Uncaught exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

// Log but do NOT crash on unhandled rejections.
// Route-level async errors in Express 4 become unhandled rejections when
// there's no try/catch; crashing the server on every bad request is worse
// than leaving it running and logging the error.
process.on("unhandledRejection", function (reason) {
  console.error("\n[WARN] Unhandled promise rejection:", reason);
});

// Run database migrations before starting
const prismaCliPath = path.join(__dirname, "../../node_modules/.bin/prisma");
const repoRoot = path.join(__dirname, "../..");
try {
  console.log("[startup] Running prisma db push (sync schema to DB)...");
  execFileSync(prismaCliPath, ["db", "push", "--accept-data-loss"], {
    stdio: "inherit",
    env: process.env,
    cwd: repoRoot,
  });
  console.log("[startup] Migrations complete.");
} catch (err) {
  console.error("[startup] Migration error (server will still start):", err.message);
}

// Load the compiled server bundle
try {
  require("./dist/server.cjs");
} catch (e) {
  console.error("\n[FATAL] Server failed to load:", e.message);
  console.error(e.stack);
  process.exit(1);
}
