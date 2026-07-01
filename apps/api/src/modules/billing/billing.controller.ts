import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { failure, success } from "@/lib/api-response";
import {
  createRazorpayOrder,
  getPlanById,
  processWebhookEvent,
  verifyAndCapturePayment,
  verifyWebhookSignature
} from "@/modules/billing/billing.service";
import { createOrderSchema, verifyPaymentSchema } from "@/schemas/billing.schema";
import { prisma } from "@/lib/prisma";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const payload = createOrderSchema.parse(req.body);
    const plan = getPlanById(payload.planId);
    if (!plan) return res.status(StatusCodes.BAD_REQUEST).json(failure("Invalid pricing plan"));
    const order = await createRazorpayOrder(req.user.id, plan.monthlyPrice * 100, payload.planId);
    return res.status(StatusCodes.CREATED).json(success(order, "Order created"));
  } catch (err: unknown) {
    // Log Razorpay errors clearly so they appear in Render logs
    const rzpErr = err as { statusCode?: number; error?: { description?: string; code?: string } };
    if (rzpErr?.error?.description) {
      console.error("[billing] Razorpay error:", rzpErr.statusCode, rzpErr.error.description);
      return res.status(StatusCodes.BAD_GATEWAY).json(
        failure(`Payment gateway error: ${rzpErr.error.description}`)
      );
    }
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const payload = verifyPaymentSchema.parse(req.body);
    // Fetch user name for email
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const subscription = await verifyAndCapturePayment({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: dbUser?.name ?? req.user.email,
      ...payload,
    });
    return res.status(StatusCodes.OK).json(success(subscription, "Payment verified"));
  } catch (err) { next(err); }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
    const invoices = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "CAPTURED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, amount: true, currency: true,
        razorpayPaymentId: true, razorpayOrderId: true,
        createdAt: true, metadata: true, invoiceNumber: true,
      },
    });
    return res.status(StatusCodes.OK).json(success(invoices));
  } catch (err) { next(err); }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody;
    if (typeof signature !== "string" || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(StatusCodes.BAD_REQUEST).json(failure("Invalid webhook signature"));
    }
    await processWebhookEvent(req.body as Record<string, unknown>);
    return res.status(StatusCodes.OK).json(success({ received: true }, "Webhook processed"));
  } catch (err) { next(err); }
}
