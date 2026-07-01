"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "@/lib/api";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pixel-panel mx-auto w-full max-w-md p-8">
        <p className="section-label">Account</p>
        <h1 className="mt-4 font-[var(--font-pixel)] text-2xl text-white">Forgot password</h1>

        {sent ? (
          <div className="mt-8 text-center">
            <Mail size={44} className="mx-auto mb-4 text-sky-200/70" strokeWidth={1.5} />
            <p className="text-sm text-white/60 leading-6">
              If an account with <strong className="text-white">{email}</strong> exists, we've sent a password reset link.
              Check your inbox (and spam folder).
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-sky-200 hover:text-sky-100 transition">
              <ArrowLeft size={13} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-white/55">
              Enter your email and we'll send you a reset link if an account exists.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm text-white/75 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agentverse.ai"
                  className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
                />
              </div>
              {error && <p className="rounded bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded border border-white/15 bg-white py-2.5 text-sm font-medium text-black transition hover:bg-sky-100 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-sm text-white/45 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sky-200 hover:text-sky-100 transition"><ArrowLeft size={13} /> Back to login</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
