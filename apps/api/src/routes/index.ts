import { Router } from "express";
import { agentRouter } from "@/routes/agent.routes";
import { authRouter } from "@/routes/auth.routes";
import { billingRouter } from "@/routes/billing.routes";
import { subscriptionRouter } from "@/routes/subscription.routes";
import { userRouter } from "@/routes/user.routes";
import { apiKeyRouter } from "@/routes/apikeys.routes";
import { conversationsRouter } from "@/routes/conversations.routes";
import { adminRouter } from "@/routes/admin.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, message: "AgentVerse API healthy" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/agents", agentRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/subscriptions", subscriptionRouter);
apiRouter.use("/api-keys", apiKeyRouter);
apiRouter.use("/conversations", conversationsRouter);
apiRouter.use("/admin", adminRouter);
