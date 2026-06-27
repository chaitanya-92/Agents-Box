import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { agentCatalog } from "@agentverse/config";
import { failure, success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAgentById } from "@/modules/agents/agent.registry";

export async function listAgents(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(StatusCodes.OK).json(success(agentCatalog));
  } catch (err) { next(err); }
}

export async function getUsageStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalInvocations, todayInvocations, recentUsage] = await Promise.all([
      prisma.agentUsage.count({ where: { userId: req.user.id } }),
      prisma.agentUsage.count({ where: { userId: req.user.id, createdAt: { gte: today } } }),
      prisma.agentUsage.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    ]);
    return res.status(StatusCodes.OK).json(success({ totalInvocations, todayInvocations, recentUsage }));
  } catch (err) { next(err); }
}

export async function invokeAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const { agentId } = req.params;
    if (typeof agentId !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Invalid agent id"));
    }
    const agent = getAgentById(agentId);
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    if (!agent) return res.status(StatusCodes.NOT_FOUND).json(failure("Agent not found"));

    const prompt = (req.body as { prompt?: string }).prompt ?? "";

    await prisma.agentUsage.create({
      data: {
        userId: req.user.id,
        agentId: agent.id,
        metadata: JSON.stringify({ prompt: prompt.slice(0, 200), invokedAt: new Date().toISOString() })
      }
    });

    // Stub response — replace with real provider integration per agent
    const stubReply = `[${agent.name}] Received your request: "${prompt.slice(0, 100)}${prompt.length > 100 ? "…" : ""}"\n\nThis is a stub response. Wire up your preferred AI provider (OpenAI, Anthropic, Gemini) in the invokeAgent handler to return real output for this agent.`;

    return res.status(StatusCodes.OK).json(
      success({ agentId: agent.id, agentName: agent.name, reply: stubReply }, "Agent invoked")
    );
  } catch (err) { next(err); }
}
