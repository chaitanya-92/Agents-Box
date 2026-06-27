import { env } from "@/config/env";
import { createApp } from "@/app";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[server] AgentVerse API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
