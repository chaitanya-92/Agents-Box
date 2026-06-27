import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { success, failure } from "@/lib/api-response";
import { env } from "@/config/env";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { comparePassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

function buildTokens(user: { id: string; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json(failure("User already exists"));
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await prisma.user.create({
      data: { name: payload.name, email: payload.email, passwordHash }
    });

    const tokens = buildTokens({ id: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return res.status(StatusCodes.CREATED).json(success({ user, tokens }, "Account created"));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (!user?.passwordHash) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Invalid credentials"));
    }

    const isMatch = await comparePassword(payload.password, user.passwordHash);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Invalid credentials"));
    }

    const tokens = buildTokens({ id: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return res.status(StatusCodes.OK).json(success({ user, tokens }, "Login successful"));
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    return res.status(StatusCodes.OK).json(success(user));
  } catch (err) {
    next(err);
  }
}

export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const oauthUser = req.user as User | undefined;

    if (!oauthUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Google authentication failed"));
    }

    const tokens = buildTokens({ id: oauthUser.id, email: oauthUser.email, role: oauthUser.role });

    await prisma.user.update({
      where: { id: oauthUser.id },
      data: { refreshToken: tokens.refreshToken }
    });

    const redirectUrl = new URL("/dashboard", env.APP_URL);
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);
    redirectUrl.searchParams.set("id", oauthUser.id);
    redirectUrl.searchParams.set("name", oauthUser.name);
    redirectUrl.searchParams.set("email", oauthUser.email);
    redirectUrl.searchParams.set("role", oauthUser.role);

    return res.redirect(redirectUrl.toString());
  } catch (err) {
    next(err);
  }
}
