import { Router } from "express";
import { env } from "@/config/env";
import { passport } from "@/modules/auth/google.strategy";
import { authenticate } from "@/middleware/authenticate";
import { googleCallback, login, me, register } from "@/modules/auth/auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.APP_URL}/login`, session: false }),
  googleCallback
);
