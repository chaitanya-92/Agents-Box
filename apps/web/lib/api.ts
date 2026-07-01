import { publicEnv } from "@/lib/env";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type RequestOptions = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; token?: string | null };

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${publicEnv.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  // JWT expired — redirect to login (but NOT for auth endpoints)
  if (response.status === 401 && !path.startsWith("/auth/")) {
    clearAuthSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const payload = (await response.json()) as ApiEnvelope<T> & { details?: unknown };
  if (!response.ok || !payload.success) throw new Error(payload.message || "Request failed");
  return payload;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthResponse = {
  user: { id: string; name: string; email: string; role: string; emailVerified?: boolean; trialEndsAt?: string | null };
  tokens: { accessToken: string; refreshToken: string };
};

export function registerUser(input: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/register", { method: "POST", body: input });
}

export function loginUser(input: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export function verifyEmail(token: string) {
  return request<null>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function resendVerification() {
  return request<null>("/auth/resend-verification", { method: "POST", token: getAccessToken() });
}

export function forgotPassword(email: string) {
  return request<null>("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPassword(token: string, password: string) {
  return request<null>("/auth/reset-password", { method: "POST", body: { token, password } });
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type Subscription = {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
};

export function getMySubscription() {
  return request<Subscription | null>("/subscriptions/me", { token: getAccessToken() });
}

// ─── Usage ───────────────────────────────────────────────────────────────────

export type UsageStats = {
  totalInvocations: number;
  todayInvocations: number;
  recentUsage: Array<{ agentId: string; createdAt: string }>;
};

export function getUsageStats() {
  return request<UsageStats>("/agents/usage", { token: getAccessToken() });
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export function invokeAgent(agentId: string, prompt: string) {
  return request<{ agentId: string; agentName: string; reply: string }>(
    `/agents/${agentId}/invoke`,
    { method: "POST", body: { prompt }, token: getAccessToken() }
  );
}

// ─── Billing / Invoices ───────────────────────────────────────────────────────

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

export type Invoice = {
  id: string;
  amount: number;
  currency: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
  metadata: string | null;
};

export function getInvoices() {
  return request<Invoice[]>("/billing/invoices", { token: getAccessToken() });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  trialEndsAt: string | null;
  createdAt: string;
};

export function getProfile() {
  return request<UserProfile>("/users/me", { token: getAccessToken() });
}

export function updateProfile(input: { name?: string; email?: string; phone?: string; gstin?: string }) {
  return request<UserProfile>("/users/me", { method: "PATCH", body: input, token: getAccessToken() });
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export type ApiKeyItem = {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  createdAt: string;
  key?: string; // only on creation response
};

export function listApiKeys() {
  return request<ApiKeyItem[]>("/api-keys", { token: getAccessToken() });
}

export function createApiKey(name: string) {
  return request<ApiKeyItem>("/api-keys", { method: "POST", body: { name }, token: getAccessToken() });
}

export function deleteApiKey(id: string) {
  return request<null>(`/api-keys/${id}`, { method: "DELETE", token: getAccessToken() });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  agentId: string;
  title: string;
  messages?: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
};

export function listConversations() {
  return request<Conversation[]>("/conversations", { token: getAccessToken() });
}

export function getConversation(id: string) {
  return request<Conversation>(`/conversations/${id}`, { token: getAccessToken() });
}

export function createConversation(input: { agentId: string; title?: string; messages?: ConversationMessage[] }) {
  return request<Conversation>("/conversations", { method: "POST", body: input, token: getAccessToken() });
}

export function updateConversation(id: string, input: { title?: string; messages?: ConversationMessage[] }) {
  return request<Conversation>(`/conversations/${id}`, { method: "PUT", body: input, token: getAccessToken() });
}

export function deleteConversation(id: string) {
  return request<null>(`/conversations/${id}`, { method: "DELETE", token: getAccessToken() });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthRevenue: number;
  signupsByDay: Record<string, number>;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  subscriptions: Array<{ planId: string; status: string }>;
};

export function getAdminStats() {
  return request<AdminStats>("/admin/stats", { token: getAccessToken() });
}

export function getAdminUsers(page = 1, search = "") {
  const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
  return request<{ users: AdminUser[]; total: number; page: number; pages: number }>(
    `/admin/users?${params}`,
    { token: getAccessToken() }
  );
}
