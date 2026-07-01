import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { success, failure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

type Message = { role: "user" | "assistant"; content: string; timestamp: string };

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, agentId: true, title: true, createdAt: true, updatedAt: true },
      take: 50,
    });
    return res.status(StatusCodes.OK).json(success(conversations));
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("Conversation not found"));
    }

    return res.status(StatusCodes.OK).json(success(conversation));
  } catch (err) {
    next(err);
  }
}

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { agentId, title, messages } = req.body as { agentId: string; title?: string; messages?: Message[] };

    if (!agentId) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("agentId is required"));
    }

    const conversation = await prisma.conversation.create({
      data: { userId, agentId, title: title ?? "New conversation", messages: (messages ?? []) as object },
    });

    return res.status(StatusCodes.CREATED).json(success(conversation));
  } catch (err) {
    next(err);
  }
}

export async function updateConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, messages } = req.body as { title?: string; messages?: Message[] };

    const existing = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("Conversation not found"));
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(messages ? { messages: messages as object } : {}),
      },
    });

    return res.status(StatusCodes.OK).json(success(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("Conversation not found"));
    }

    await prisma.conversation.delete({ where: { id } });
    return res.status(StatusCodes.OK).json(success(null, "Conversation deleted"));
  } catch (err) {
    next(err);
  }
}
