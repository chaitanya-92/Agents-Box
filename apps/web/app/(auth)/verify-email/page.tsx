"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";

type Status = "loading" | "success" | "error" | "missing";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pixel-panel mx-auto w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-6 h-10 w-10 border-2 border-sky-200/20 border-t-sky-200 rounded-full animate-spin" />
            <p className="text-sm text-white/60">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center text-3xl">✅</div>
            <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Email verified!</h1>
            <p className="text-sm text-white/55 mb-6">Your account is now fully activated. You're ready to go.</p>
            <Link
              href="/dashboard"
              className="inline-block border border-sky-200/40 bg-sky-200/10 px-6 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition"
            >
              Go to Dashboard →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center text-3xl">❌</div>
            <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Verification failed</h1>
            <p className="text-sm text-white/55 mb-6">{message || "This link may be invalid or expired."}</p>
            <Link
              href="/dashboard"
              className="text-sm text-sky-200 hover:text-sky-100 transition underline"
            >
              Go to dashboard to resend verification
            </Link>
          </>
        )}

        {status === "missing" && (
          <>
            <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Check your email</h1>
            <p className="text-sm text-white/55">We've sent a verification link to your email address. Click it to activate your account.</p>
            <p className="mt-4 text-xs text-white/35">The link expires in 24 hours.</p>
          </>
        )}
      </div>
    </main>
  );
}
