"use client";

import ThemeSwitcher from "@/components/theme-switcher";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0b0e46] to-[#07070f] px-4">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>
      <div className="relative z-10 flex flex-col items-center space-y-6 w-full">
        <Image
          src="/logo.svg"
          alt="Numen Lean Services Logo"
          width={150}
          height={150}
          className="mx-auto"
        />
        {children}
      </div>
    </main>
  );
} 