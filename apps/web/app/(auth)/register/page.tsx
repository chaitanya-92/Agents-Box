import { AuthForm } from "@/components/marketing/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <AuthForm variant="register" />
    </main>
  );
}

