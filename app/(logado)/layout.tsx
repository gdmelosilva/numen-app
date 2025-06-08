import { AppSidebar, SidebarInset, SidebarProvider } from "@/components/sidebar";
import React from 'react'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
      <>
      <SidebarProvider>
        <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            {children}
          </SidebarInset>
      </SidebarProvider>
      </>
    )
}