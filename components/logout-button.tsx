"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={logout}
      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
      title="Sair"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Sair</span>
    </Button>
  );
}
