import type { Request, Response } from "express";
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

export async function createOrder(req: Request, res: Response) {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
  }

  const payload = createOrderSchema.parse(req.body);
  const plan = getPlanById(payload.planId);

  if (!plan) {
    return res.status(StatusCodes.BAD_REQUEST).json(failure("Invalid pricing plan"));
  }

  const order = await createRazorpayOrder(req.user.id, plan.monthlyPrice * 100, payload.planId);
  return res.status(StatusCodes.CREATED).json(success(order, "Order created"));
}

export async function verifyPayment(req: Request, res: Response) {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json(failure("Authentication required"));
  }

  const payload = verifyPaymentSchema.parse(req.body);
  const subscription = await verifyAndCapturePayment({
    userId: req.user.id,
    ...payload
  });

  return res.status(StatusCodes.OK).json(success(subscription, "Payment verified"));
}

export async function handleWebhook(req: Request, res: Response) {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;

  if (typeof signature !== "string" || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
    return res.status(StatusCodes.BAD_REQUEST).json(failure("Invalid webhook signature"));
  }

  await processWebhookEvent(req.body as Record<string, unknown>);
  return res.status(StatusCodes.OK).json(success({ received: true }, "Webhook processed"));
}
