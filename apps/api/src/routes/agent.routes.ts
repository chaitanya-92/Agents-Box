import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { requireActiveSubscription } from "@/middleware/require-subscription";
import { invokeAgent, listAgents } from "@/modules/agents/agents.controller";

export const agentRouter = Router();

agentRouter.get("/", listAgents);
agentRouter.post("/:agentId/invoke", authenticate, requireActiveSubscription, invokeAgent);

