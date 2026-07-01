"use client";

import { useRouter } from "next/navigation";
import type { PricingPlan } from "@agentverse/config";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export function PaymentButton({ plan, highlighted }: { plan: PricingPlan; highlighted?: boolean }) {
  const router = useRouter();

  const startCheckout = () => {
    const user = getCurrentUser();
    if (!user) {
      // Not logged in → register first, redirect back to plans after auth
      router.push("/register?redirect=/plans");
      return;
    }
    // Logged in → go to /plans and auto-open billing modal for this plan
    router.push(`/plans?plan=${plan.id}`);
  };

  return (
    <div className="mt-8">
      <Button
        className="w-full"
        variant={highlighted ? "default" : "ghost"}
        onClick={startCheckout}
      >
        Choose {plan.name}
      </Button>
    </div>
  );
}
