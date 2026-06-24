import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { failure } from "@/lib/api-response";
import { SUBSCRIPTION_STATUS } from "@/lib/domain-types";
import { prisma } from "@/lib/prisma";

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: SUBSCRIPTION_STATUS.ACTIVE
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!subscription) {
    return res.status(StatusCodes.PAYMENT_REQUIRED).json(failure("An active subscription is required"));
  }

  return next();
}
