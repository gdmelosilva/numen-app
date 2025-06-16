import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getUserProfile, UserProfile } from '@/components/UserProfileGetter';

export function useUserProfile(): {
  user: ReturnType<typeof useCurrentUser>['user'];
  profile: UserProfile;
  loading: boolean;
} {
  const { user, loading } = useCurrentUser();
  const profile = user ? getUserProfile(user) : null;
  return { user, profile, loading };
}