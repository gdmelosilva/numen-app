import { AuthenticatedUser } from '@/lib/api-auth';
import { UserRole } from '@/hooks/useOptions';

export type UserProfile =
    | 'admin-adm'
    | 'manager-adm'
    | 'functional-adm'
    | 'admin-client'
    | 'manager-client'
    | 'functional-client'
    | null;

export function getUserProfile(user: AuthenticatedUser): UserProfile {
    if (!user) return null;
    const role = typeof user.role === 'number' ? user.role : Number(user.role);
    const profileMap: Record<string, Record<number, UserProfile>> = {
        adm: {
            [UserRole.Admin]: 'admin-adm',
            [UserRole.Manager]: 'manager-adm',
            [UserRole.Functional]: 'functional-adm',
        },
        client: {
            [UserRole.Admin]: 'admin-client',
            [UserRole.Manager]: 'manager-client',
            [UserRole.Functional]: 'functional-client',
        },
    };
    const key = user.is_client ? 'client' : 'adm';
    return profileMap[key][role] ?? null;
}