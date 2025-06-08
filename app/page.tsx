"use client"

import { useState } from 'react';
import { SignUpForm } from "@/components/sign-up-form";
import { LoginForm } from "@/components/login-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import ThemeSwitcher from "@/components/theme-switcher";
import Image from "next/image";

export default function Home() {

  // Controller da view atual
  const [currentView, setCurrentView] = useState('login');
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onForgotPassword={() => setCurrentView('forgot')} />;
      case 'forgot':
        return <ForgotPasswordForm onBack={() => setCurrentView('login')} />;
      case 'signup':
        return <SignUpForm onBack={() => setCurrentView('login')} />;
      default:
        return <LoginForm onForgotPassword={() => setCurrentView('forgot')} />;
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0b0e46] to-[#07070f] px-4">
      <Image
      src="/bg.png"
      alt="Background"
      fill
      className="object-cover pointer-events-none z-0 opacity-40"
      />
      <div className="absolute top-4 right-4 z-20">
      <ThemeSwitcher />
      </div>
      <div className="relative z-10 flex flex-col items-center space-y-12 w-full">
      <Image
        src="/logo.svg"
        alt="Numen Lean Services Logo"
        width={150}
        height={150}
        className="mx-auto"
      />
      {renderView()}
      </div>
    </main>
  );
}
