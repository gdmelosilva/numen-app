"use client"

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import React from 'react'

async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
}

const AuthProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { user } = useCurrentUser();
  if (user?.is_active == false) {
    signOut()
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-700 mb-6">
            Você não tem permissão para acessar esta página.
            </p>
            <Link href="/">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Voltar para o início
            </span>
            </Link>
        </div>
        </div>
    );
  }

  return (
    <>
        {children}
    </>
  )
}

export default AuthProvider