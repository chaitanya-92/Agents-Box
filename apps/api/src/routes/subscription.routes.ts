import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { listSubscriptions } from "@/modules/subscriptions/subscriptions.controller";

export const subscriptionRouter = Router();

subscriptionRouter.get("/", authenticate, listSubscriptions);

