import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { getAdminStats, getAdminUsers, getAdminPayments } from "@/modules/admin/admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.get("/stats", getAdminStats);
adminRouter.get("/users", getAdminUsers);
adminRouter.get("/payments", getAdminPayments);
