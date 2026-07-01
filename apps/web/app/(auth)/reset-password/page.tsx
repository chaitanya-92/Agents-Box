"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { KeyRound, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!token) { setError("Missing reset token — use the link from your email"); return; }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" strokeWidth={1.5} />
        <h1 className="font-[var(--font-pixel)] text-xl text-white mb-3">Password updated!</h1>
        <p className="text-sm text-white/55">Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <>
      <p className="section-label">Account</p>
      <div className="mt-4 flex items-center gap-3">
        <KeyRound size={22} className="text-sky-200/70" strokeWidth={1.5} />
        <h1 className="font-[var(--font-pixel)] text-2xl text-white">Set new password</h1>
      </div>
      <p className="mt-3 text-sm text-white/55">Choose a strong password for your account.</p>

      {!token ? (
        <div className="mt-8 rounded bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Invalid reset link. Please{" "}
          <Link href="/forgot-password" className="underline">request a new one</Link>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm text-white/75 mb-1.5">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/75 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
            />
          </div>
          {error && <p className="rounded bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded border border-white/15 bg-white py-2.5 text-sm font-medium text-black transition hover:bg-sky-100 disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="pixel-panel mx-auto w-full max-w-md p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-sky-200/20 border-t-sky-200 rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
