export type PricingPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 999,
    yearlyPrice: 9999,
    description: "For creators and solo operators getting started with AI agents.",
    features: ["6 core agents", "10K monthly credits", "Basic analytics", "Email support"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    description: "For power users that need the full agent catalog and workflow speed.",
    features: ["All agents", "75K monthly credits", "Priority processing", "Razorpay billing", "Google OAuth"],
    highlighted: true
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 6999,
    yearlyPrice: 69999,
    description: "For teams running AI workflows in production with governance controls.",
    features: ["Unlimited seats", "250K monthly credits", "Agent API Hub", "Usage governance", "Webhook events"]
  }
];

