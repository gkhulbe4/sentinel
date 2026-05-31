import type { Metadata } from "next";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { SignupForm } from "@/features/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account · Sentinel",
  description: "Start monitoring Solana in real time — free, no card required.",
};

export default function SignupPage() {
  return (
    <AuthCardShell title="Create account" description="Start monitoring Solana in real time. It’s free to begin.">
      <SignupForm />
    </AuthCardShell>
  );
}
