import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider, AppSidebar } from "@/components/sidebar";
import { BreadcrumbDynamic } from "@/components/BreadcrumbDynamic";
import ThemeSwitcher from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import "../globals.css";

export const metadata: Metadata = {
  title: "Numen Ops - Home",
  description: "Plataforma de Gestão Operacional Numen",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center justify-between border-b px-4">
            <BreadcrumbDynamic />
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LogoutButton />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
