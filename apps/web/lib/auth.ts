const ACCESS_TOKEN_KEY = "agentverse.accessToken";
const REFRESH_TOKEN_KEY = "agentverse.refreshToken";
const USER_KEY = "agentverse.user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified?: boolean;
};

export function storeAuthSession(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(input.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

