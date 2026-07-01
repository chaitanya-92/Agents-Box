import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { failure, success } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name:  z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, avatarUrl: true },
    });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json(failure("User not found"));
    return res.status(StatusCodes.OK).json(success(user));
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const payload = updateProfileSchema.parse(req.body);

    // If changing email, check it's not taken
    if (payload.email && payload.email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: payload.email } });
      if (existing) return res.status(StatusCodes.CONFLICT).json(failure("Email already in use"));
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(payload.name  !== undefined ? { name: payload.name }   : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
        ...(payload.email !== undefined ? { email: payload.email } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, avatarUrl: true },
    });

    return res.status(StatusCodes.OK).json(success(user, "Profile updated"));
  } catch (err) { next(err); }
}
