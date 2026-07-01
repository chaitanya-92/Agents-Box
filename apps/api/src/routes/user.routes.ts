import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { getProfile, updateProfile } from "@/modules/users/users.controller";

export const userRouter = Router();

userRouter.get("/me", authenticate, getProfile);
userRouter.patch("/me", authenticate, updateProfile);
