"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser, verifyOtp, resendOtp, ApiError, type AuthResponse } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { Mail, RefreshCw, ArrowLeft, ShieldCheck } from "lucide-react";

type AuthVariant = "login" | "register";

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{message}</p>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded border border-white/15 bg-white py-2.5 text-sm font-medium text-black transition hover:bg-sky-100 disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ─── OTP Entry step (shared between Login & Register flows) ───────────────────

function OtpStep({
  email,
  onSuccess,
  onBack,
  context,       // "register" colours info box blue; "login" uses amber
}: {
  email: string;
  onSuccess: (data: AuthResponse) => void;
  onBack: () => void;
  context: "register" | "login";
}) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // 60 s countdown — start immediately
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setVerifying(true);
    try {
      const res = await verifyOtp(email, otp);
      onSuccess(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      // If server says too many attempts or code expired, offer resend immediately
      if (err instanceof ApiError && err.details?.needsResend) {
        setCountdown(0);
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      await resendOtp(email);
      setCountdown(60);
      setOtp("");
    } catch (err) {
      if (err instanceof ApiError && typeof err.details?.waitSeconds === "number") {
        setCountdown(err.details.waitSeconds as number);
        setError(`Please wait ${err.details.waitSeconds}s before resending.`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  }

  const borderColour = context === "register"
    ? "border-sky-400/20 bg-sky-400/[0.06]"
    : "border-amber-400/20 bg-amber-400/[0.06]";
  const textColour = context === "register" ? "text-sky-200" : "text-amber-200";

  return (
    <div className="mt-8 space-y-5">
      {/* Info banner */}
      <div className={`rounded border ${borderColour} px-5 py-4 text-center`}>
        <div className="flex justify-center mb-3">
          <Mail size={28} className={textColour} strokeWidth={1.5} />
        </div>
        <p className={`text-sm font-medium ${textColour} mb-1`}>
          {context === "register" ? "Check your email" : "Verify your email to continue"}
        </p>
        <p className="text-xs text-white/50 leading-5">
          We sent a 6-digit code to{" "}
          <strong className="text-white">{email}</strong>.
          <br />
          Check your inbox (and spam folder).
        </p>
      </div>

      {/* OTP input */}
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm text-white/75 mb-2">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            className="w-full rounded border border-white/15 bg-white/[0.04] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder:text-white/20 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {error && <ErrorBox message={error} />}

        <SubmitButton
          loading={verifying}
          label={context === "register" ? "Verify & Activate Account →" : "Verify & Login →"}
          loadingLabel="Verifying…"
        />
      </form>

      {/* Resend */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-xs text-white/35">
            Resend code in <span className="tabular-nums">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-xs text-sky-200 hover:text-sky-100 transition disabled:opacity-50"
          >
            <RefreshCw size={11} className={resending ? "animate-spin" : ""} />
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition"
      >
        <ArrowLeft size={11} />
        {context === "register" ? "Back to registration" : "Back to login"}
      </button>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showOtp, setShowOtp]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      storeAuthSession({
        accessToken:  res.data.tokens.accessToken,
        refreshToken: res.data.tokens.refreshToken,
        user:         res.data.user,
      });
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiError && err.details?.needsVerification) {
        // Backend sent a fresh OTP — switch to OTP step
        setShowOtp(true);
        setError("");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (showOtp) {
    return (
      <OtpStep
        email={email}
        context="login"
        onSuccess={(data) => {
          storeAuthSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
          router.push(redirect);
        }}
        onBack={() => { setShowOtp(false); setError(""); }}
      />
    );
  }

  return (
    <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
      {error && <ErrorBox message={error} />}
      <SubmitButton loading={loading} label="Login" loadingLabel="Logging in…" />
    </form>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

function RegisterFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showOtp, setShowOtp]   = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2)   { setError("Name must be at least 2 characters"); return; }
    if (!email.includes("@"))     { setError("Enter a valid email address"); return; }
    if (password.length < 8)      { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm)     { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await registerUser({ name, email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (showOtp) {
    return (
      <OtpStep
        email={email}
        context="register"
        onSuccess={(data) => {
          storeAuthSession({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
          router.push(redirect);
        }}
        onBack={() => { setShowOtp(false); setError(""); }}
      />
    );
  }

  return (
    <form onSubmit={handleRegister} className="mt-8 space-y-5">
      <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@agentverse.ai" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
      <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
      {error && <ErrorBox message={error} />}
      <p className="text-xs text-white/35">
        By registering you get a free 7-day Pro trial — no card required.
      </p>
      <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating account…" />
    </form>
  );
}

// ─── AuthForm (outer shell) ───────────────────────────────────────────────────

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
