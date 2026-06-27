import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireActiveSubscription } from "@/middleware/require-subscription";
import { getUsageStats, invokeAgent, listAgents } from "@/modules/agents/agents.controller";

export const agentRouter = Router();

agentRouter.get("/", listAgents);
agentRouter.get("/usage", authenticate, getUsageStats);
agentRouter.post("/:agentId/invoke", authenticate, requireActiveSubscription, invokeAgent);
