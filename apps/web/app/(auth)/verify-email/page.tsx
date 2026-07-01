"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type Status = "loading" | "success" | "error" | "missing";

function VerifyEmailContent() {
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

  if (status === "loading") {
    return (
      <>
        <Loader2 size={36} className="mx-auto mb-5 text-sky-200/60 animate-spin" />
        <p className="text-sm text-white/60">Verifying your email…</p>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <CheckCircle2 size={48} className="mx-auto mb-5 text-emerald-400" strokeWidth={1.5} />
        <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Email verified!</h1>
        <p className="text-sm text-white/55 mb-6">Your account is now fully activated. You're ready to go.</p>
        <Link
          href="/dashboard"
          className="inline-block border border-sky-200/40 bg-sky-200/10 px-6 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition"
        >
          Go to Dashboard →
        </Link>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <XCircle size={48} className="mx-auto mb-5 text-rose-400" strokeWidth={1.5} />
        <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Verification failed</h1>
        <p className="text-sm text-white/55 mb-6">{message || "This link may be invalid or expired."}</p>
        <Link href="/dashboard" className="text-sm text-sky-200 hover:text-sky-100 transition underline">
          Go to dashboard to resend verification
        </Link>
      </>
    );
  }

  // missing token
  return (
    <>
      <Mail size={40} className="mx-auto mb-5 text-sky-200/60" strokeWidth={1.5} />
      <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Check your email</h1>
      <p className="text-sm text-white/55">
        We've sent a verification link to your email address. Click it to activate your account.
      </p>
      <p className="mt-4 text-xs text-white/35">The link expires in 24 hours.</p>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pixel-panel mx-auto w-full max-w-md p-8 text-center">
        <Suspense fallback={
          <div className="mx-auto h-10 w-10 border-2 border-sky-200/20 border-t-sky-200 rounded-full animate-spin" />
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  );
}
