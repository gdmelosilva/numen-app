"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from "@/components/sign-up-form";
import { LoginForm } from "@/components/login-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { ResetPasswordForm } from "@/components/reset-password-form";
import ThemeSwitcher from "@/components/theme-switcher";
import Image from "next/image";
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('login');
  const [isProcessingAuth, setIsProcessingAuth] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();
      
      // Check if this is an auth callback with tokens in the URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      console.log('Auth tokens:', { accessToken: !!accessToken, type });
      
      if (accessToken && refreshToken && type === 'invite') {
        try {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setIsProcessingAuth(false);
            return;
          }
          
          console.log('Session established successfully');
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          // Redirect to update password
          router.push('/auth/update-password');
          return;
        } catch (error) {
          console.error('Session setup error:', error);
        }
      }

      // Check if this is a password recovery callback
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting recovery session:', error);
            setIsProcessingAuth(false);
            return;
          }
          
          console.log('Recovery session established successfully');
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          // Show reset password view
          setCurrentView('reset-password');
          setIsProcessingAuth(false);
          return;
        } catch (error) {
          console.error('Recovery session setup error:', error);
        }
      }

      // Check if user is already authenticated
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push('/main');
        } else {
          // No session and no invite tokens, show login
          setIsProcessingAuth(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsProcessingAuth(false);
      }
    };

    handleAuth();
  }, [router]);

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onForgotPassword={() => setCurrentView('forgot')} onResetPassword={() => setCurrentView('reset-password')} />;
      case 'forgot':
        return <ForgotPasswordForm onBack={() => setCurrentView('login')} />;
      case 'signup':
        return <SignUpForm onBack={() => setCurrentView('login')} />;
      case 'reset-password':
        return <ResetPasswordForm onBack={() => setCurrentView('login')} />;
      default:
        return <LoginForm onForgotPassword={() => setCurrentView('forgot')} onResetPassword={() => setCurrentView('reset-password')} />;
    }
  };

  // Show loading while processing auth
  if (isProcessingAuth) {
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
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2">Processando...</p>
          </div>
        </div>
      </main>
    );
  }

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
