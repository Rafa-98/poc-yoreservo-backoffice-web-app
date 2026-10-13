import { Suspense } from "react";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { LoginForm } from "@/features/auth/ui/login-form";

export function LoginPage() {
  return (
    <AuthShellLayout bgImageSrc="/pitch-aerial.jpg">
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <LoginForm />
      </Suspense>
    </AuthShellLayout>
  );
}
