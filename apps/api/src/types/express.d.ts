import type { UserRole } from "@/lib/domain-types";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      name?: string;
      avatarUrl?: string | null;
    }

    interface Request {
      rawBody?: string;
    }
  }
}

export {};
