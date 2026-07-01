"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser, registerUser } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

type AuthVariant = "login" | "register";

function Field({
  label, type = "text", value, onChange, placeholder, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; error?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm text-white/75">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function LoginFields() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      storeAuthSession({
        accessToken: res.data.tokens.accessToken,
        refreshToken: res.data.tokens.refreshToken,
        user: res.data.user,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@agentverse.ai" />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-white/75">Password</label>
          <Link href="/forgot-password" className="text-xs text-sky-200 hover:text-sky-100 transition">
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
        />
      </div>
      {error && <p className="rounded bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-white/15 bg-white py-2.5 text-sm font-medium text-black transition hover:bg-sky-100 disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

function RegisterFields() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await registerUser({ name, email, password });
      storeAuthSession({
        accessToken: res.data.tokens.accessToken,
        refreshToken: res.data.tokens.refreshToken,
        user: res.data.user,
      });
      setRegistered(true);
      // Redirect to dashboard after 4s so user reads the message
      setTimeout(() => router.push("/dashboard"), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="mt-8 rounded border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-5 text-center">
        <p className="text-2xl mb-3">📬</p>
        <p className="text-sm font-medium text-emerald-300 mb-1">Account created!</p>
        <p className="text-xs text-white/55 leading-5">
          We've emailed a verification link to <strong className="text-white">{email}</strong>.
          Check your inbox (and spam) to verify your account.
        </p>
        <p className="mt-3 text-xs text-white/35">Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Field label="Full Name" value={name} onChange={setName} placeholder="Chaitanya" />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@agentverse.ai" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      {error && <p className="rounded bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
      <p className="text-xs text-white/35">
        By registering you get a free 7-day Pro trial — no card required.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-white/15 bg-white py-2.5 text-sm font-medium text-black transition hover:bg-sky-100 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}

export function AuthForm({ variant }: { variant: AuthVariant }) {
  const googleHref = `${publicEnv.apiUrl}/auth/google`;

  return (
    <div className="pixel-panel mx-auto w-full max-w-lg p-6 sm:p-8">
      <p className="section-label">{variant === "login" ? "Welcome back" : "Create your workspace"}</p>
      <h1 className="mt-4 font-[var(--font-pixel)] text-2xl text-white">
        {variant === "login" ? "Login to AgentVerse" : "Start with AgentVerse"}
      </h1>
      <p className="mt-4 text-sm leading-7 text-white/65">
        {variant === "login"
          ? "Sign in to access your agents, subscriptions, and usage analytics."
          : "Create an account to access the full agent marketplace."}
      </p>

      {variant === "login" ? <LoginFields /> : <RegisterFields />}

      {publicEnv.googleAuthEnabled ? (
        <a
          href={googleHref}
          className="mt-4 flex h-11 w-full items-center justify-center border border-white/15 bg-white/[0.03] text-sm text-white/80 transition hover:bg-white/[0.06]"
        >
          Continue with Google
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 flex h-11 w-full cursor-not-allowed items-center justify-center border border-white/10 bg-white/[0.02] text-sm text-white/35"
        >
          Continue with Google
        </button>
      )}

      <p className="mt-6 text-sm text-white/55">
        {variant === "login" ? "Need an account?" : "Already have an account?"}{" "}
        <Link href={variant === "login" ? "/register" : "/login"} className="text-sky-200">
          {variant === "login" ? "Register" : "Login"}
        </Link>
      </p>
    </div>
  );
}
