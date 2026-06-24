"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeAuthSession } from "@/lib/auth";

export function OauthSessionSync() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const id = searchParams.get("id");
    const role = searchParams.get("role");

    if (!accessToken || !refreshToken || !email || !name || !id || !role) {
      return;
    }

    storeAuthSession({
      accessToken,
      refreshToken,
      user: {
        id,
        name,
        email,
        role
      }
    });

    router.replace("/dashboard");
  }, [router, searchParams]);

  return null;
}

