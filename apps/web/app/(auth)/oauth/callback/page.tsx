"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeAuthSession, type AuthUser } from "@/lib/auth";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken  = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const id           = searchParams.get("id");
    const name         = searchParams.get("name");
    const email        = searchParams.get("email");
    const role         = searchParams.get("role");

    if (accessToken && refreshToken && id && name && email && role) {
      const user: AuthUser = { id, name, email, role, emailVerified: true };
      storeAuthSession({ accessToken, refreshToken, user });
      router.replace("/dashboard");
    } else {
      // Missing params — send to login with error
      router.replace("/login?oauth=failed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b10]">
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 rounded-full border-2 border-sky-200/30 border-t-sky-200 animate-spin" />
        <p className="text-sm text-white/40">Signing you in…</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080b10]">
          <span className="h-8 w-8 rounded-full border-2 border-sky-200/30 border-t-sky-200 animate-spin" />
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
