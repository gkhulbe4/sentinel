import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <AppShell email={session?.user?.email} name={session?.user?.name}>
      {children}
    </AppShell>
  );
}
