import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your watchtower</CardTitle>
          <CardDescription>Track Solana activity in real time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignupForm />
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
