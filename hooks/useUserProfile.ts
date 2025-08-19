import { useUserContext } from '@/components/user-context';
import { getUserProfile, UserProfile } from '@/components/UserProfileGetter';

export function useUserProfile(): {
  user: ReturnType<typeof useUserContext>['user'];
  profile: UserProfile;
  loading: boolean;
} {
  const { user, loading } = useUserContext();
  const profile = user ? getUserProfile(user) : null;
  return { user, profile, loading };
}