"use client"

import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthenticatedUser } from '@/lib/api-auth';
import DeniedAccessPage from '@/components/DeniedAccessPage';
import { useRouter } from 'next/navigation';

// Define user roles as an enum for better type safety and readability
export enum UserRole {
  Admin = 1,
  Manager = 2,
  Functional = 3,
}

// Utility function to map roles to profiles
function getUserProfile(user: AuthenticatedUser) {
  if (!user) return null;
  const role = typeof user.role === 'number' ? user.role : Number(user.role);
  if (!user.is_client) {
    if (role === UserRole.Admin) return 'admin-adm';
    if (role === UserRole.Manager) return 'manager-adm';
    if (role === UserRole.Functional) return 'functional-adm';
  } else {
    if (role === UserRole.Admin) return 'admin-client';
    if (role === UserRole.Manager) return 'manager-client';
    if (role === UserRole.Functional) return 'functional-client';
  }
  return null;
}

// Main AMS Page Component
export default function AmsPageContent() {
  const { user, loading } = useCurrentUser();
  const profile = user ? getUserProfile(user) : null;
  const router = useRouter();

  React.useEffect(() => {
    if (profile === 'admin-adm' || profile === 'manager-adm') {
      router.push("/main/smartcare/ams/admin");
    } else if (profile === 'admin-client' || profile === 'manager-client') {
      router.push("/main/smartcare/ams/client");
    }
  }, [profile, router]);

  if (loading) {
    return <LoadingSpinner/>
  }

  if (!user) {
    return <div>User not authenticated or not found.</div>;
  }

  if (!profile) {
    return <div>User profile not identified.</div>;
  }

  // Denied access for functional roles
  if (profile === 'functional-adm' || profile === 'functional-client') {
    return <DeniedAccessPage />;
  }

  return null;
}