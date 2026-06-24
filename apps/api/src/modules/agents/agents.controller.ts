import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { agentCatalog } from "@agentverse/config";
import { success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAgentById } from "@/modules/agents/agent.registry";

export async function listAgents(_req: Request, res: Response) {
  return res.status(StatusCodes.OK).json(success(agentCatalog));
}

export async function invokeAgent(req: Request, res: Response) {
  const { agentId } = req.params;
  const agent = getAgentById(agentId);

  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Authentication required" });
  }

  if (!agent) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Agent not found" });
  }

  await prisma.agentUsage.create({
    data: {
      userId: req.user.id,
      agentId: agent.id,
      metadata: {
        source: "api",
        invokedAt: new Date().toISOString()
      }
    }
  });

  return res.status(StatusCodes.OK).json(
    success({
      agent,
      response: `Stubbed execution for ${agent.name}. Replace with provider-specific orchestration.`
    })
  );
}

