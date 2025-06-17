import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  project_id?: string;
  id: string;
  email: string;
  role: number;
  partner_id?: string | null;
  is_active: boolean;
  is_client: boolean;
  first_name: string;
  last_name: string;
}

export async function authenticateRequest(): Promise<{
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Unauthorized: Invalid or missing authentication" },
          { status: 401 }
        )
      };
    }

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "User data not found" },
          { status: 404 }
        )
      };
    }

    return {
      user: userData as AuthenticatedUser,
      error: null
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: "Internal authentication error" },
        { status: 500 }
      )
    };
  }
}

export function requireRole(allowedRoles: number[]) {
  return (user: AuthenticatedUser): NextResponse | null => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }
    return null;
  };
}

export function requirePartnerAccess(user: AuthenticatedUser, targetPartnerId?: string): NextResponse | null {
  // Se for admin, pode acessar tudo
  if (user.role === USER_ROLES.ADMIN) {
    return null;
  }
  
  // Se não for admin e não tiver partner_id, não pode acessar
  if (!user.partner_id) {
    return NextResponse.json(
      { error: "Forbidden: No partner access" },
      { status: 403 }
    );
  }
  
  // Se especificou um partner específico, verificar se tem acesso
  if (targetPartnerId && user.partner_id !== targetPartnerId) {
    return NextResponse.json(
      { error: "Forbidden: Partner access denied" },
      { status: 403 }
    );
  }
  
  return null;
}

// Tipos de roles para facilitar uso
export const USER_ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  USER: 3,
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
