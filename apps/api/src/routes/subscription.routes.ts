import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { listSubscriptions, mySubscription } from "@/modules/subscriptions/subscriptions.controller";

export const subscriptionRouter = Router();

subscriptionRouter.get("/", authenticate, listSubscriptions);
subscriptionRouter.get("/me", authenticate, mySubscription);
