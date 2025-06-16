"use client"

import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import LoadingSpinner from '@/components/LoadingSpinner';
import DeniedAccessPage from '@/components/DeniedAccessPage';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/components/UserProfileGetter';

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