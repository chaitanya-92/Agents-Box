// Startup wrapper — catches ANY synchronous crash during module loading
// and prints the full error before exiting.
process.on("uncaughtException", function(err) {
  console.error("\n[FATAL] Uncaught exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on("unhandledRejection", function(reason) {
  console.error("\n[FATAL] Unhandled rejection:", reason);
  process.exit(1);
});

try {
  require("./dist/server.cjs");
} catch (e) {
  console.error("\n[FATAL] Server failed to load:", e.message);
  console.error(e.stack);
  process.exit(1);
}
