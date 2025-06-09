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

    // Support all filters from the page
    const search = searchParams.get("search");
    const partner_ext_id = searchParams.get("partner_ext_id");
    const partner_desc = searchParams.get("partner_desc");
    const partner_ident = searchParams.get("partner_ident");
    const partner_email = searchParams.get("partner_email");
    const partner_tel = searchParams.get("partner_tel");
    const partner_mkt_sg = searchParams.get("partner_mkt_sg");
    const is_compadm = searchParams.get("is_compadm");
    const is_active = searchParams.get("is_active");

    let query = supabase
      .from('partner')
      .select(`
        id,
        partner_ext_id,
        partner_desc,
        partner_ident,
        partner_email,
        partner_tel,
        partner_mkt_sg,
        is_compadm,
        is_active,
        created_at
      `);

    // Apply filters
    if (search) {
      query = query.or(
        `partner_desc.ilike.%${search}%,partner_email.ilike.%${search}%,partner_ext_id.ilike.%${search}%`
      );
    }
    if (partner_ext_id) {
      query = query.ilike('partner_ext_id', `%${partner_ext_id}%`);
    }
    if (partner_desc) {
      query = query.ilike('partner_desc', `%${partner_desc}%`);
    }
    if (partner_ident) {
      query = query.ilike('partner_ident', `%${partner_ident}%`);
    }
    if (partner_email) {
      query = query.ilike('partner_email', `%${partner_email}%`);
    }
    if (partner_tel) {
      query = query.ilike('partner_tel', `%${partner_tel}%`);
    }
    if (partner_mkt_sg) {
      query = query.ilike('partner_mkt_sg', `%${partner_mkt_sg}%`);
    }
    if (is_compadm !== null && is_compadm !== undefined) {
      if (is_compadm === "true") query = query.eq('is_compadm', true);
      else if (is_compadm === "false") query = query.eq('is_compadm', false);
    }
    if (is_active !== null && is_active !== undefined) {
      if (is_active === "true") query = query.eq('is_active', true);
      else if (is_active === "false") query = query.eq('is_active', false);
    }

    const { data: partners, error: supabaseError } = await query.order("created_at", {
      ascending: false,
    });

    if (supabaseError) {
      console.error("Erro Supabase:", supabaseError);
      return NextResponse.json(
        { error: "Erro ao buscar parceiros", details: supabaseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(partners);
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
    
    console.log('Current user:', {
      id: user!.id,
      role: user!.role,
      is_client: user!.is_client,
      partner_id: user!.partner_id
    });
    
    // Validar se pode criar usuário para este partner
    // Apenas admins não-clientes podem criar usuários para qualquer partner
    const isUnrestrictedAdmin = user!.role === USER_ROLES.ADMIN && !user!.is_client;
    
    console.log('Permission check:', {
      isAdmin: user!.role === USER_ROLES.ADMIN,
      isClient: user!.is_client,
      isUnrestrictedAdmin,
      targetPartnerId: partnerId,
      userPartnerId: user!.partner_id
    });
    
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