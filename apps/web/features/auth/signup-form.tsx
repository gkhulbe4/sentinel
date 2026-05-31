"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { ApiError, apiFetch } from "@/lib/api";
import { authFooterLinkClass } from "@/components/auth/auth-chrome";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const authInputClass = "h-10 text-base md:text-sm";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: { name: values.name, email: values.email, password: values.password },
      });
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!res || res.error) throw new Error("Could not sign in after signup");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <AuthField id="signup-name" label="Name" error={errors.name?.message}>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          className={authInputClass}
          {...register("name", {
            required: "Enter your name",
            maxLength: { value: 80, message: "Name is too long" },
            onChange: () => setFormError(null),
          })}
        />
      </AuthField>

      <AuthField id="signup-email" label="Email" error={errors.email?.message}>
        <Input
          id="signup-email"
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

      <AuthField id="signup-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="signup-password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          className={authInputClass}
          {...register("password", {
            required: "Create a password",
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          })}
        />
      </AuthField>

      <AuthField
        id="signup-confirm"
        label="Confirm password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="signup-confirm"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          className={authInputClass}
          {...register("confirmPassword", {
            required: "Re-enter your password",
            validate: (v) => v === getValues("password") || "Passwords do not match",
          })}
        />
      </AuthField>

      {formError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm leading-relaxed text-destructive">
          {formError}
        </div>
      ) : null}

      <Button className="h-10 w-full" type="submit" loading={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm leading-normal text-pretty text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className={authFooterLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
