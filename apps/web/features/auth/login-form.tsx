"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { authFooterLinkClass } from "@/components/auth/auth-chrome";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginValues {
  email: string;
  password: string;
}

const authInputClass = "h-10 text-base md:text-sm";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextHref = params.get("callbackUrl") ?? "/dashboard";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (!res || res.error) {
      setFormError("Those details don’t match an account. Check them or create a new one.");
      return;
    }
    router.push(nextHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <AuthField id="login-email" label="Email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          className={authInputClass}
          {...register("email", {
            required: "Enter your email",
            pattern: { value: EMAIL_RE, message: "Enter a valid email address" },
            onChange: () => setFormError(null),
          })}
        />
      </AuthField>
      <AuthField id="login-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          className={authInputClass}
          {...register("password", { required: "Enter your password", onChange: () => setFormError(null) })}
        />
      </AuthField>

      {formError ? (
        <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
          {formError}
        </div>
      ) : null}

      <Button className="h-10 w-full" type="submit" loading={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm leading-normal text-pretty text-muted-foreground">
        Don’t have an account?{" "}
        <Link href="/signup" className={authFooterLinkClass}>
          Sign up
        </Link>
      </p>
    </form>
  );
}
