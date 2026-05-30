import { auth } from "@/auth";
import { SignOutButton } from "@/features/auth/sign-out-button";

// Placeholder dashboard. The live alert feed lands in Phase 9.
export default async function DashboardPage() {
  const session = await auth();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Signed in as {session?.user?.email}. The live alert feed arrives in Phase 9.
      </p>
    </main>
  );
}
