import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { success, failure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

function generateKey(): { fullKey: string; keyHash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const fullKey = `av_live_${raw}`;
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const prefix = fullKey.slice(0, 12);
  return { fullKey, keyHash, prefix };
}

export async function listApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, lastUsed: true, createdAt: true },
    });
    return res.status(StatusCodes.OK).json(success(keys));
  } catch (err) {
    next(err);
  }
}

export async function createApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { name } = req.body as { name?: string };

    if (!name?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Key name is required"));
    }

    const count = await prisma.apiKey.count({ where: { userId } });
    if (count >= 10) {
      return res.status(StatusCodes.FORBIDDEN).json(failure("Maximum of 10 API keys allowed"));
    }

    const { fullKey, keyHash, prefix } = generateKey();

    const apiKey = await prisma.apiKey.create({
      data: { userId, name: name.trim(), keyHash, prefix },
      select: { id: true, name: true, prefix: true, createdAt: true },
    });

    // Return full key ONCE — not stored in DB
    return res.status(StatusCodes.CREATED).json(success({ ...apiKey, key: fullKey }, "API key created. Copy it now — it won't be shown again."));
  } catch (err) {
    next(err);
  }
}

export async function deleteApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } });
    if (!apiKey) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("API key not found"));
    }

    await prisma.apiKey.delete({ where: { id } });
    return res.status(StatusCodes.OK).json(success(null, "API key revoked"));
  } catch (err) {
    next(err);
  }
}
