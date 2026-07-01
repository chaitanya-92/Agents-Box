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
import { sendMail, buildOtpEmail, buildPasswordResetEmail } from "@/lib/mailer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTokens(user: { id: string; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateOtp(): string {
  // Cryptographically random 6-digit code
  return String(100000 + (crypto.randomInt(900000)));
}

// ─── In-memory OTP attempt tracker ───────────────────────────────────────────
// Acceptable for single-instance deployment (Render). Resets on restart, but
// OTPs also expire in 10 min so the security window is short either way.

const OTP_MAX_ATTEMPTS = 5;
const OTP_WINDOW_MS    = 10 * 60 * 1000; // 10 min (match OTP lifetime)
const RESEND_COOLDOWN_MS = 60 * 1000;    // 60 s

const otpAttempts = new Map<string, { count: number; windowStart: number }>();

function checkOtpAttempts(email: string): boolean {
  const now = Date.now();
  const entry = otpAttempts.get(email);
  if (!entry || now - entry.windowStart > OTP_WINDOW_MS) {
    otpAttempts.set(email, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= OTP_MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

function clearOtpAttempts(email: string) {
  otpAttempts.delete(email);
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        // User exists but never verified — resend a fresh OTP instead of an error
        const otp = generateOtp();
        const verificationExpiry = new Date(Date.now() + OTP_WINDOW_MS);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { verificationToken: otp, verificationExpiry },
        });
        clearOtpAttempts(payload.email);
        sendMail({
          to: existingUser.email,
          subject: "Your AgentVerse verification code",
          html: buildOtpEmail({ name: existingUser.name, otp }),
        }).catch(console.error);
        return res.status(StatusCodes.OK).json(
          success({ email: existingUser.email }, "A new verification code has been sent to your email.")
        );
      }
      return res.status(StatusCodes.CONFLICT).json(failure("An account with this email already exists."));
    }

    const passwordHash = await hashPassword(payload.password);
    const otp = generateOtp();
    const verificationExpiry = new Date(Date.now() + OTP_WINDOW_MS);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        verificationToken: otp,
        verificationExpiry,
        emailVerified: false,
        trialEndsAt,
        subscriptions: {
          create: {
            planId: "pro",
            status: "TRIAL",
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
          },
        },
      },
    });

    // Fire-and-forget OTP email
    sendMail({
      to: user.email,
      subject: "Your AgentVerse verification code",
      html: buildOtpEmail({ name: user.name, otp }),
    }).catch(console.error);

    // Return only email — NO tokens until verified
    return res.status(StatusCodes.CREATED).json(
      success(
        { email: user.email },
        "Account created. Enter the verification code sent to your email."
      )
    );
  } catch (err) {
    next(err);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

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

    if (!user.emailVerified) {
      // Issue a fresh OTP so the user can complete verification right now
      const otp = generateOtp();
      const verificationExpiry = new Date(Date.now() + OTP_WINDOW_MS);
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: otp, verificationExpiry },
      });
      clearOtpAttempts(user.email);
      sendMail({
        to: user.email,
        subject: "Your AgentVerse verification code",
        html: buildOtpEmail({ name: user.name, otp }),
      }).catch(console.error);

      return res.status(StatusCodes.FORBIDDEN).json(
        failure("Please verify your email before logging in.", {
          needsVerification: true,
          email: user.email,
        })
      );
    }

    const tokens = buildTokens({ id: user.id, email: user.email, role: user.role });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return res.status(StatusCodes.OK).json(
      success(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
            trialEndsAt: user.trialEndsAt,
          },
          tokens,
        },
        "Login successful"
      )
    );
  } catch (err) {
    next(err);
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };
    if (!email || !otp) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Email and OTP are required"));
    }

    // Check attempt count before touching DB
    if (!checkOtpAttempts(email)) {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json(
        failure("Too many failed attempts. Please request a new code.", { needsResend: true })
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("User not found"));
    }
    if (user.emailVerified) {
      clearOtpAttempts(email);
      return res.status(StatusCodes.CONFLICT).json(failure("Email already verified. Please log in."));
    }

    // Check expiry first (before comparing code)
    if (!user.verificationToken || !user.verificationExpiry || user.verificationExpiry < new Date()) {
      return res.status(StatusCodes.GONE).json(
        failure("This code has expired. Please request a new one.", { needsResend: true })
      );
    }

    // Constant-time compare to prevent timing attacks
    const expected = Buffer.from(user.verificationToken.padEnd(32, "0"));
    const received = Buffer.from((otp.trim()).padEnd(32, "0"));
    const match = expected.length === received.length && crypto.timingSafeEqual(expected, received);

    if (!match) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Incorrect code. Please try again."));
    }

    // Verified ✓
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
    });
    clearOtpAttempts(email);

    const tokens = buildTokens({ id: user.id, email: user.email, role: user.role });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return res.status(StatusCodes.OK).json(
      success(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: true,
            trialEndsAt: user.trialEndsAt,
          },
          tokens,
        },
        "Email verified successfully!"
      )
    );
  } catch (err) {
    next(err);
  }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Email is required"));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return res.status(StatusCodes.OK).json(success(null, "If this email exists, a new code has been sent."));
    }
    if (user.emailVerified) {
      return res.status(StatusCodes.CONFLICT).json(failure("This email is already verified. Please log in."));
    }

    // Rate limit: 60 s between resends
    // If expiry > (now + 9 min), OTP was sent less than 1 min ago → too soon
    if (user.verificationExpiry && user.verificationExpiry > new Date(Date.now() + OTP_WINDOW_MS - RESEND_COOLDOWN_MS)) {
      const waitMs = user.verificationExpiry.getTime() - Date.now() - (OTP_WINDOW_MS - RESEND_COOLDOWN_MS);
      const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json(
        failure(`Please wait ${waitSeconds}s before requesting a new code.`, { waitSeconds })
      );
    }

    const otp = generateOtp();
    const verificationExpiry = new Date(Date.now() + OTP_WINDOW_MS);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: otp, verificationExpiry },
    });
    clearOtpAttempts(email);

    sendMail({
      to: user.email,
      subject: "Your AgentVerse verification code",
      html: buildOtpEmail({ name: user.name, otp }),
    }).catch(console.error);

    return res.status(StatusCodes.OK).json(success(null, "A new verification code has been sent to your email."));
  } catch (err) {
    next(err);
  }
}

// ─── Verify email (legacy link flow — kept for backward compat) ────────────────

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Token is required"));
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token, emailVerified: false },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json(failure("Invalid or expired verification link"));
    }
    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return res.status(StatusCodes.GONE).json(failure("Verification link has expired. Please request a new one."));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpiry: null },
    });

    return res.status(StatusCodes.OK).json(success(null, "Email verified successfully"));
  } catch (err) {
    next(err);
  }
}

// ─── Resend verification (legacy — kept for backward compat) ──────────────────

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

    const otp = generateOtp();
    const verificationExpiry = new Date(Date.now() + OTP_WINDOW_MS);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: otp, verificationExpiry } });
    clearOtpAttempts(user.email);

    await sendMail({
      to: user.email,
      subject: "Your AgentVerse verification code",
      html: buildOtpEmail({ name: user.name, otp }),
    });

    return res.status(StatusCodes.OK).json(success(null, "Verification code sent"));
  } catch (err) {
    next(err);
  }
}

// ─── Forgot / Reset password ──────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Email is required"));
    }

    // Always return 200 — prevents email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash) {
      const resetToken = randomToken();
      const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 h

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;
      await sendMail({
        to: user.email,
        subject: "Reset your AgentVerse password",
        html: buildPasswordResetEmail({ name: user.name, resetUrl }),
      });
    }

    return res
      .status(StatusCodes.OK)
      .json(success(null, "If that email exists, a reset link has been sent."));
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
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    return res.status(StatusCodes.OK).json(success(null, "Password reset successfully. You can now log in."));
  } catch (err) {
    next(err);
  }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, trialEndsAt: true, createdAt: true },
    });
    return res.status(StatusCodes.OK).json(success(user));
  } catch (err) {
    next(err);
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const oauthUser = req.user as User | undefined;
    if (!oauthUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json(failure("Google authentication failed"));
    }

    const tokens = buildTokens({ id: oauthUser.id, email: oauthUser.email, role: oauthUser.role });
    await prisma.user.update({
      where: { id: oauthUser.id },
      data: { refreshToken: tokens.refreshToken, emailVerified: true },
    });

    const redirectUrl = new URL("/oauth/callback", env.APP_URL);
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);
    redirectUrl.searchParams.set("id", oauthUser.id);
    redirectUrl.searchParams.set("name", oauthUser.name);
    redirectUrl.searchParams.set("email", oauthUser.email);
    redirectUrl.searchParams.set("role", oauthUser.role);
    redirectUrl.searchParams.set("emailVerified", "true");

    return res.redirect(redirectUrl.toString());
  } catch (err) {
    next(err);
  }
}
