import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider, AppSidebar } from "@/components/sidebar";
import { BreadcrumbDynamic } from "@/components/BreadcrumbDynamic";
import { ThemeSwitcher } from "@/components/theme-switcher";
import "./globals.css";


export const metadata: Metadata = {
  title: "Numen Ops - Home",
  description: "Plataforma de Gestão Operacional Numen",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-14 items-center justify-between border-b px-4">
                  <BreadcrumbDynamic />
                  <ThemeSwitcher />
                </header>
                <main className="flex-1 p-6">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
