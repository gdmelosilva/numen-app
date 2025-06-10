"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar";

export default function SidebarMarginWrapper({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();
  return (
    <div
      className={cn(
        "flex flex-1 w-full relative z-10 transition-all duration-300",
        expanded ? "ml-64" : "ml-16"
      )}
    >
      {children}
    </div>
  );
}
