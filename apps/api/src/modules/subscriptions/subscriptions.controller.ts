import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { failure, success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const subscriptions = await prisma.subscription.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { updatedAt: "desc" }
    });
    return res.status(StatusCodes.OK).json(success(subscriptions));
  } catch (err) { next(err); }
}

export async function mySubscription(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" }
    });
    return res.status(StatusCodes.OK).json(success(subscription ?? null));
  } catch (err) { next(err); }
}
