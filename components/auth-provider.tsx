"use client"

import { useCurrentUser } from '@/hooks/useCurrentUser';
import React from 'react'



const AuthProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { user } = useCurrentUser();
  if (!user?.is_active) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this content.</p>
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