import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { failure } from "@/lib/api-response";
import type { UserRole } from "@/lib/domain-types";
import { verifyAccessToken } from "@/lib/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role as UserRole };
    return next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json(failure("Invalid or expired token"));
  }
}
