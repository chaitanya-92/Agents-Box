import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import { failure, success } from "@/lib/api-response";
import { isGoogleOAuthConfigured } from "@/lib/oauth";
import { passport } from "@/modules/auth/google.strategy";
import { authenticate } from "@/middleware/authenticate";
import { googleCallback, login, me, register } from "@/modules/auth/auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);
authRouter.get("/providers", (_req, res) => {
  res.status(StatusCodes.OK).json(
    success({
      google: isGoogleOAuthConfigured()
    })
  );
});

authRouter.get("/google", (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json(
      failure("Google OAuth is not configured on the server", {
        required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"]
      })
    );
  }

  return passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

authRouter.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(`${env.APP_URL}/login?oauth=disabled`);
    }

    return passport.authenticate("google", { failureRedirect: `${env.APP_URL}/login?oauth=failed`, session: false })(
      req,
      res,
      next
    );
  },
  googleCallback
);
