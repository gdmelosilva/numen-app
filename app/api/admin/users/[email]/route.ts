import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";

export async function PUT(request: Request, context: { params: Promise<{ email: string }> }) {
  // Await params as per Next.js dynamic API route requirements
  const { email } = await context.params;

  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para editar usuários
  const roleCheck = requireRole([USER_ROLES.ADMIN])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();
    const {
      firstName,
      lastName,
      telephone,
      role,
      partnerId,
    } = await request.json();

    // Buscar usuário pelo email
    const { data: existingUser, error: fetchError } = await supabase
      .from("user")
      .select("id, email, partner_id")
      .eq("email", email)
      .single();
    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Permissão: admins não-clientes podem editar qualquer usuário, outros só do próprio partner
    const isUnrestrictedAdmin = user!.role === USER_ROLES.ADMIN && !user!.is_client;
    if (!isUnrestrictedAdmin && existingUser.partner_id !== user!.partner_id) {
      return NextResponse.json({ error: "Forbidden: Cannot edit user from another partner." }, { status: 403 });
    }

    // Atualizar usuário
    const updateData: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      tel_contact: telephone,
      role,
    };
    if (partnerId) {
      updateData.partner_id = partnerId;
    }
    const { error: updateError } = await supabase
      .from("user")
      .update(updateData)
      .eq("email", email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
