import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";

export async function GET(request: Request) {

  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para listar usuários
  const roleCheck = requireRole([USER_ROLES.ADMIN])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const active = searchParams.get("active");
    
    let query = supabase
      .from('user')
      .select(`
        id,
        first_name,
        last_name,
        email,
        is_client,
        tel_contact,
        role,
        partner_id,
        created_at,
        is_active
      `);    
      
    // Filtrar por role e is_client do usuário logado
    // Admin não-cliente pode ver tudo (não aplica filtros)
    // Admin cliente, manager ou outros roles: só podem ver usuários do mesmo partner
    // Se não tem partner_id, só pode ver a si mesmo
    if (user!.role === USER_ROLES.ADMIN && !user!.is_client) { 
    } else {
      if (user!.partner_id) {
        query = query.eq('partner_id', user!.partner_id);
      } else {
        query = query.eq('id', user!.id);
      }
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (active !== null) {
      query = query.eq("is_active", active === "true");
    }

    const { data: users, error: supabaseError } = await query.order("created_at", {
      ascending: false,
    });

    if (supabaseError) {
      console.error("Erro Supabase:", supabaseError);
      return NextResponse.json(
        { error: "Erro ao buscar usuários", details: supabaseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para criar usuários
  const roleCheck = requireRole([USER_ROLES.ADMIN])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();
    
    const { 
      email, 
      firstName, 
      lastName, 
      telephone,
      isClient,
      role,
      partnerId 
    } = await request.json();    console.log('Creating user with data:', {
      email,
      firstName,
      lastName,
      telephone,
      isClient: Boolean(isClient),
      role,
      partnerId
    });    
    
    // Validar se pode criar usuário para este partner
    // Apenas admins não-clientes podem criar usuários para qualquer partner
    const isUnrestrictedAdmin = user!.role === USER_ROLES.ADMIN && !user!.is_client;
    
    if (!isUnrestrictedAdmin) {
      // Usuários restritos (não-admins ou admins clientes) só podem criar para seu próprio partner
      if (partnerId !== user!.partner_id) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot create user for different partner' },
          { status: 403 }
        );
      }
    }

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, and lastName are required.' },
        { status: 400 }
      );
    }

    const { data, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
        data: {
          first_name: firstName,
          last_name: lastName,
          is_client: Boolean(isClient),
          tel_contact: telephone || null,
          role: role,
          partner_id: partnerId || user!.partner_id // Use o partner do usuário logado se não especificado
        }
      }
    );

    if (authError) {
      console.error('Supabase auth error:', {
        message: authError.message,
        status: authError.status,
        code: authError.code
      });
      throw authError;
    }

    return NextResponse.json({ success: true, user: data.user });

  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    console.error('Full error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });

    // Handle specific database errors
    let friendlyMessage = 'An unexpected error occurred.';
    let status = 500;

    if (error.message?.includes('Database error saving new user')) {
      friendlyMessage = 'Database error occurred while creating user. Please check the user data and try again.';
      status = 500;
    } else if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
      friendlyMessage = 'A user with this email already exists.';
      status = 409;
    } else if (error.message?.includes('Foreign Key Violation')) {
      friendlyMessage = 'Invalid role or partner ID provided.';
      status = 400;
    } else if (error.message?.includes('Invalid UUID Format')) {
      friendlyMessage = 'Invalid partner ID format.';
      status = 400;
    }

    return NextResponse.json({ 
      error: friendlyMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status });
  }
}
