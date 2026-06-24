import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function listSubscriptions(req: Request, res: Response) {
  const userId = req.user?.id;
  const subscriptions = await prisma.subscription.findMany({
    where: userId ? { userId } : undefined,
    orderBy: {
      updatedAt: "desc"
    }
  });

  return res.status(StatusCodes.OK).json(success(subscriptions));
}

