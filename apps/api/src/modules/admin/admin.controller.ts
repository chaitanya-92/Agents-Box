import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { success, failure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

function requireAdmin(req: Request, res: Response): boolean {
  if (req.user?.role !== "ADMIN") {
    res.status(StatusCodes.FORBIDDEN).json(failure("Admin access required"));
    return false;
  }
  return true;
}

export async function getAdminStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!requireAdmin(req, res)) return;

    const [
      totalUsers,
      activeSubscriptions,
      payments,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
      prisma.payment.findMany({
        where: { status: "CAPTURED" },
        select: { amount: true, createdAt: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 7,
        select: { createdAt: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Revenue last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthRevenue = payments
      .filter((p) => p.createdAt >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    // Signups per day last 7 days
    const signupsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      signupsByDay[d.toISOString().slice(0, 10)] = 0;
    }
    recentUsers.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (key in signupsByDay) signupsByDay[key]++;
    });

    return res.status(StatusCodes.OK).json(success({
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      monthRevenue,
      signupsByDay,
    }));
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    if (!requireAdmin(req, res)) return;

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) ?? "";

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          emailVerified: true, createdAt: true,
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { planId: true, status: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json(success({ users, total, page, pages: Math.ceil(total / limit) }));
  } catch (err) {
    next(err);
  }
}

export async function getAdminPayments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!requireAdmin(req, res)) return;

    const payments = await prisma.payment.findMany({
      where: { status: "CAPTURED" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, amount: true, currency: true, razorpayPaymentId: true,
        razorpayOrderId: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return res.status(StatusCodes.OK).json(success(payments));
  } catch (err) {
    next(err);
  }
}
