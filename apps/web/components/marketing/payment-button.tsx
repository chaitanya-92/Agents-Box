"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingPlan } from "@agentverse/config";
import { Button } from "@/components/ui/button";
import { createPricingOrder, verifyPricingPayment } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentButton({ plan, highlighted }: { plan: PricingPlan; highlighted?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startCheckout = async () => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (!publicEnv.razorpayKeyId) {
      setError("Missing Razorpay public key. Add NEXT_PUBLIC_RAZORPAY_KEY_ID in apps/web/.env.local.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay checkout");
      }

      const orderResponse = await createPricingOrder(plan.id);
      const order = orderResponse.data;

      const razorpay = new window.Razorpay({
        key: publicEnv.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "AgentVerse AI",
        description: `${plan.name} monthly subscription`,
        order_id: order.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await verifyPricingPayment({
            planId: plan.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });

          router.push("/dashboard");
        },
        theme: {
          color: "#b9e6ff"
        },
        prefill: {
          name: user.name,
          email: user.email
        }
      });

      razorpay.open();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Button className="w-full" variant={highlighted ? "default" : "ghost"} onClick={startCheckout} disabled={isLoading}>
        {isLoading ? "Opening..." : `Choose ${plan.name}`}
      </Button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

