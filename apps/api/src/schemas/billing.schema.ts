import { z } from "zod";

export const createOrderSchema = z.object({
  planId: z.string().min(1)
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  planId: z.string().min(1)
});
