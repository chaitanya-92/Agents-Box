// Catch-all error handlers so the real error always shows in logs before exit
process.on("uncaughtException", (err) => {
  console.error("[server] UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[server] UNHANDLED REJECTION:", reason);
  process.exit(1);
});

import { env } from "@/config/env";
import { createApp } from "@/app";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`AgentVerse API listening on port ${env.PORT} (NODE_ENV=${env.NODE_ENV})`);
});
