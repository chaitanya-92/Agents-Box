import { Suspense } from "react";
import { AuthForm } from "@/components/marketing/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Suspense>
        <AuthForm variant="login" />
      </Suspense>
    </main>
  );
}
