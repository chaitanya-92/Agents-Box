import { Router } from "express";
import { authenticate } from "@/middleware/authenticate";
import { createOrder, handleWebhook, verifyPayment, listInvoices } from "@/modules/billing/billing.controller";

export const billingRouter = Router();

billingRouter.post("/create-order", authenticate, createOrder);
billingRouter.post("/verify-payment", authenticate, verifyPayment);
billingRouter.post("/webhook", handleWebhook);
billingRouter.get("/invoices", authenticate, listInvoices);

