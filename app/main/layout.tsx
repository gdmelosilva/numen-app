import type { Metadata } from "next";
import { SidebarInset, SidebarProvider, AppSidebar } from "@/components/sidebar";
import { TopBar } from "@/components/TopBar";
// import Image from "next/image";
import "../globals.css";
import { UserProvider } from "@/components/user-context";
import SidebarMarginWrapper from "@/components/sidebar/SidebarMarginWrapper";

export const metadata: Metadata = {
  title: "EasyTime - Home",
  description: "Plataforma de Gestão Operacional Numen",
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Remoção da verificação de auth redundante - já é feita no middleware
  // const supabase = await createClient();
  // const { data: { user }, error } = await supabase.auth.getUser();

  // if (error || !user) {
  //   redirect("/");
  // }

  return (
    <UserProvider>
      <SidebarProvider>
          <div className="flex min-h-screen bg-transparent dark:bg-transparent relative">
            <div className="absolute inset-0 z-0">
              {/* <Image
                src="/bg.png"
                alt="Background"
                fill
                className="object-cover pointer-events-none opacity-40 dark:opacity-0"
              /> */}
            </div>
            <div className="flex flex-1 w-full relative z-10">
              <AppSidebar />
              <SidebarMarginWrapper>
                <SidebarInset>
                  <TopBar />
                  <main className="flex-1 p-6">
                    {children}
                  </main>
                </SidebarInset>
              </SidebarMarginWrapper>
            </div>
          </div>
        </SidebarProvider>
      </UserProvider>
  );
}
