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
        partner_segment: partner_partner_mkt_sg_fkey(
          name
        ),
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

  // Verificar se tem permissão para criar parceiros
  const roleCheck = requireRole([USER_ROLES.ADMIN])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();

    // Recebe os campos do parceiro
    const {
      partner_desc,
      partner_ident,
      partner_email,
      partner_tel,
      partner_mkt_sg,
      partner_cep,
      partner_addrs,
      partner_compl,
      partner_distr,
      partner_city,
      partner_state,
      partner_cntry,
      is_compadm,
    } = await request.json();

    // Validação simples
    if (
      !partner_desc ||
      !partner_ident ||
      !partner_email ||
      !partner_tel
    ) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400 }
      );
    }

    // Insere o novo parceiro
    const { data, error: insertError } = await supabase
      .from("partner")
      .insert([
        {
            partner_desc,
            partner_ident,
            partner_email,
            partner_tel,
            partner_mkt_sg,
            partner_cep,
            partner_addrs,
            partner_compl,
            partner_distr,
            partner_city,
            partner_state,
            partner_cntry,
            is_active: true,
            is_compadm,
        },
      ])
      .select()
      .single();

    if (insertError) {
      let friendlyMessage = "Erro ao criar parceiro.";
      let status = 500;
      if (
        insertError.message?.includes("duplicate key") ||
        insertError.message?.includes("already exists")
      ) {
        friendlyMessage = "Já existe um parceiro com este identificador ou email.";
        status = 409;
      }
      return NextResponse.json(
        { error: friendlyMessage, details: insertError.message },
        { status }
      );
    }

    return NextResponse.json({ success: true, partner: data });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}