import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { success, failure } from "@/lib/api-response";
import { env } from "@/config/env";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { comparePassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";
import { sendMail, buildVerificationEmail, buildPasswordResetEmail } from "@/lib/mailer";

function buildTokens(user: { id: string; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json(failure("User already exists"));
    }

    const passwordHash = await hashPassword(payload.password);
    const verificationToken = randomToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user + 7-day Pro trial subscription in a transaction
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        verificationToken,
        verificationExpiry,
        trialEndsAt,
        subscriptions: {
          create: {
            planId: "pro",
            status: "TRIAL",
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
          }
        }
      }
    });

    const tokens = buildTokens({ id: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    // Send verification email (fire-and-forget)
    const verifyUrl = `${env.APP_URL}/verify-email?token=${verificationToken}`;
    sendMail({
      to: user.email,
      subject: "Verify your AgentVerse email",
      html: buildVerificationEmail({ name: user.name, verifyUrl }),
    }).catch(console.error);

    return res.status(StatusCodes.CREATED).json(success({ user, tokens }, "Account created. Please check your email to verify."));
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

    return res.status(StatusCodes.OK).json(success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        trialEndsAt: user.trialEndsAt,
      },
      tokens
    }, "Login successful"));
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Token is required"));
    }

    const user = await prisma.user.findUnique({ where: { verificationToken: token } });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("Invalid or expired verification link"));
    }

    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return res.status(StatusCodes.GONE).json(failure("Verification link has expired. Please request a new one."));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      }
    });

    return res.status(StatusCodes.OK).json(success(null, "Email verified successfully"));
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(StatusCodes.NOT_FOUND).json(failure("User not found"));
    if (user.emailVerified) {
      return res.status(StatusCodes.CONFLICT).json(failure("Email is already verified"));
    }

    const verificationToken = randomToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpiry }
    });

    const verifyUrl = `${env.APP_URL}/verify-email?token=${verificationToken}`;
    await sendMail({
      to: user.email,
      subject: "Verify your AgentVerse email",
      html: buildVerificationEmail({ name: user.name, verifyUrl }),
    });

    return res.status(StatusCodes.OK).json(success(null, "Verification email sent"));
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Email is required"));
    }

    // Always return 200 to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash) {
      const resetToken = randomToken();
      const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      });

      const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
      await sendMail({
        to: user.email,
        subject: "Reset your AgentVerse password",
        html: buildPasswordResetEmail({ name: user.name, resetUrl }),
      });
    }

    return res.status(StatusCodes.OK).json(success(null, "If that email exists, a reset link has been sent."));
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Token and new password are required"));
    }
    if (password.length < 6) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Password must be at least 6 characters"));
    }

    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(StatusCodes.GONE).json(failure("Reset link is invalid or expired"));
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null }
    });

    return res.status(StatusCodes.OK).json(success(null, "Password reset successfully. You can now log in."));
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
      select: { id: true, name: true, email: true, role: true, emailVerified: true, trialEndsAt: true, createdAt: true }
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
      data: { refreshToken: tokens.refreshToken, emailVerified: true }
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
