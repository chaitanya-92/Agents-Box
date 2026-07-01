import crypto from "node:crypto";
import Razorpay from "razorpay";
import { pricingPlans } from "@agentverse/config";
import { env } from "@/config/env";
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from "@/lib/domain-types";
import { sendMail, buildWelcomeEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

export async function createRazorpayOrder(userId: string, amount: number, planId: string) {
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `av_${userId.slice(0, 8)}_${Date.now().toString(36)}`, // max 40 chars
    notes: {
      planId
    }
  });

  await prisma.payment.create({
    data: {
      userId,
      amount,
      razorpayOrderId: order.id,
      status: PAYMENT_STATUS.CREATED,
      metadata: JSON.stringify({ planId })
    }
  });

  return order;
}

export function getPlanById(planId: string) {
  return pricingPlans.find((plan) => plan.id === planId);
}

export async function verifyAndCapturePayment(input: {
  userId: string;
  userEmail: string;
  userName: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  planId: string;
}) {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== input.razorpaySignature) {
    throw new Error("Payment signature verification failed");
  }

  const matchedPlan = pricingPlans.find((plan) => plan.id === input.planId);
  if (!matchedPlan) {
    throw new Error("Invalid plan selected");
  }

  await prisma.payment.update({
    where: { razorpayOrderId: input.razorpayOrderId },
    data: {
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
      status: PAYMENT_STATUS.CAPTURED
    }
  });

  const subscription = await prisma.subscription.upsert({
    where: {
      razorpaySubscriptionId: input.razorpayOrderId
    },
    update: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      planId: input.planId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    create: {
      userId: input.userId,
      planId: input.planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      razorpaySubscriptionId: input.razorpayOrderId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Send congratulation email (fire and forget)
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  sendMail({
    to: input.userEmail,
    subject: `🎉 Welcome to AgentVerse AI — ${matchedPlan.name} activated!`,
    html: buildWelcomeEmail({
      name: input.userName,
      planName: matchedPlan.name,
      amount: (await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId }, select: { amount: true } }))?.amount ?? 0,
      paymentId: input.razorpayPaymentId,
      orderId: input.razorpayOrderId,
      date,
    }),
  }).catch(() => {});

  return subscription;
}

export function verifyWebhookSignature(body: string, signature: string) {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export async function processWebhookEvent(event: Record<string, unknown>) {
  const payload = event.payload as Record<string, any> | undefined;
  const paymentEntity = payload?.payment?.entity;
  const subscriptionEntity = payload?.subscription?.entity;

  if (paymentEntity?.order_id) {
    await prisma.payment.updateMany({
      where: { razorpayOrderId: paymentEntity.order_id },
      data: {
        razorpayPaymentId: paymentEntity.id,
        status: paymentEntity.status === "captured" ? PAYMENT_STATUS.CAPTURED : PAYMENT_STATUS.FAILED
      }
    });
  }

  if (subscriptionEntity?.id) {
    await prisma.subscription.updateMany({
      where: { razorpaySubscriptionId: subscriptionEntity.id },
      data: {
        status:
          subscriptionEntity.status === "active"
            ? SUBSCRIPTION_STATUS.ACTIVE
            : subscriptionEntity.status === "cancelled"
              ? SUBSCRIPTION_STATUS.CANCELED
              : SUBSCRIPTION_STATUS.PAST_DUE
      }
    });
  }
}
