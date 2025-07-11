import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para editar parceiros
  const roleCheck = requireRole([USER_ROLES.ADMIN])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();
    const {
      partner_desc,
      partner_ident,
      partner_email,
      partner_tel,
      partner_mkt_sg, // string (id ou nome do segmento)
      is_active,
      is_compadm,
      partner_cep,
      partner_addrs,
      partner_compl,
      partner_distr,
      partner_city,
      partner_state,
      partner_cntry
    } = await request.json();

    // Buscar parceiro pelo id
    const { data: existingPartner, error: fetchError } = await supabase
      .from("partner")
      .select("id")
      .eq("id", id)
      .single();
    if (fetchError || !existingPartner) {
      return NextResponse.json({ error: "Parceiro não encontrado." }, { status: 404 });
    }

    // Atualizar parceiro
    const updateData: Record<string, unknown> = {
      partner_desc,
      partner_ident,
      partner_email,
      partner_tel,
      partner_mkt_sg,
      is_active,
      is_compadm,
      partner_cep,
      partner_addrs,
      partner_compl,
      partner_distr,
      partner_city,
      partner_state,
      partner_cntry
    };
    const { error: updateError } = await supabase
      .from("partner")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partner")
      .select("*, partner_segment: partner_partner_mkt_sg_fkey(*)")
      .eq("id", id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Parceiro não encontrado." }, { status: 404 });
    }
    // Corrige o nome do campo para partner_segment, não parceiro
    return NextResponse.json(data);
  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
