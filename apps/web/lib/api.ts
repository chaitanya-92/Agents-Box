import { publicEnv } from "@/lib/env";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type RequestOptions = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; token?: string | null };

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${publicEnv.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  // JWT expired — redirect to login (but NOT for auth endpoints, which return 401 on bad credentials)
  if (response.status === 401 && !path.startsWith("/auth/")) {
    clearAuthSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const payload = (await response.json()) as ApiEnvelope<T> & { details?: unknown };
  if (!response.ok || !payload.success) throw new Error(payload.message || "Request failed");
  return payload;
}

export type AuthResponse = {
  user: { id: string; name: string; email: string; role: string };
  tokens: { accessToken: string; refreshToken: string };
};

export type Subscription = {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
};

export type UsageStats = {
  totalInvocations: number;
  todayInvocations: number;
  recentUsage: Array<{ agentId: string; createdAt: string }>;
};

export function registerUser(input: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/register", { method: "POST", body: input });
}

export function loginUser(input: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export function getMySubscription() {
  return request<Subscription | null>("/subscriptions/me", { token: getAccessToken() });
}

export function getUsageStats() {
  return request<UsageStats>("/agents/usage", { token: getAccessToken() });
}

export function invokeAgent(agentId: string, prompt: string) {
  return request<{ agentId: string; agentName: string; reply: string }>(
    `/agents/${agentId}/invoke`,
    { method: "POST", body: { prompt }, token: getAccessToken() }
  );
}

export function createPricingOrder(planId: string) {
  return request<{ id: string; amount: number; currency: string }>(
    "/billing/create-order",
    { method: "POST", body: { planId }, token: getAccessToken() }
  );
}

export function verifyPricingPayment(input: {
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return request("/billing/verify-payment", { method: "POST", body: input, token: getAccessToken() });
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function getProfile() {
  return request<UserProfile>("/users/me", { token: getAccessToken() });
}

export function updateProfile(input: { name?: string; email?: string; phone?: string }) {
  return request<UserProfile>("/users/me", { method: "PATCH", body: input, token: getAccessToken() });
}
