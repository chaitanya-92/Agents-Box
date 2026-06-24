"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser, registerUser } from "@/lib/api";
import { storeAuthSession } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name is required")
});

type AuthVariant = "login" | "register";
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function LoginFields() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);

    try {
      const response = await loginUser(values);
      storeAuthSession({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        user: response.data.user
      });
      router.push("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm text-white/75">Email</label>
        <Input {...form.register("email")} placeholder="you@agentverse.ai" />
        <p className="text-xs text-rose-300">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/75">Password</label>
        <Input type="password" {...form.register("password")} placeholder="••••••••" />
        <p className="text-xs text-rose-300">{form.formState.errors.password?.message}</p>
      </div>
      <Button type="submit" className="w-full">
        {form.formState.isSubmitting ? "Logging in..." : "Login"}
      </Button>
      {submitError ? <p className="text-sm text-rose-300">{submitError}</p> : null}
    </form>
  );
}

function RegisterFields() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError(null);

    try {
      const response = await registerUser(values);
      storeAuthSession({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        user: response.data.user
      });
      router.push("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm text-white/75">Full Name</label>
        <Input {...form.register("name")} placeholder="Chaitanya" />
        <p className="text-xs text-rose-300">{form.formState.errors.name?.message}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/75">Email</label>
        <Input {...form.register("email")} placeholder="you@agentverse.ai" />
        <p className="text-xs text-rose-300">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/75">Password</label>
        <Input type="password" {...form.register("password")} placeholder="••••••••" />
        <p className="text-xs text-rose-300">{form.formState.errors.password?.message}</p>
      </div>
      <Button type="submit" className="w-full">
        {form.formState.isSubmitting ? "Creating..." : "Create Account"}
      </Button>
      {submitError ? <p className="text-sm text-rose-300">{submitError}</p> : null}
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
          ? "Use your email and password or continue with Google once backend credentials are configured."
          : "Create an account to access subscriptions, usage analytics, and the full agent marketplace."}
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
          Google login not configured
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
