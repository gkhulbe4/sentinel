"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Button
      variant={collapsed ? "ghost" : "outline"}
      size={collapsed ? "icon-sm" : "sm"}
      onClick={() => void signOut({ callbackUrl: "/" })}
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
      {!collapsed ? "Sign out" : null}
    </Button>
  );
}
