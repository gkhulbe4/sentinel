import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · Sentinel",
  description: "Sign in to your Sentinel workspace — watch rules, live alerts, and AI analysis.",
};

export default function LoginPage() {
  return (
    <AuthCardShell title="Sign in" description="Use your email and password to access your workspace.">
      {/* LoginForm reads ?callbackUrl via useSearchParams; Suspense lets the page prerender. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCardShell>
  );
}
