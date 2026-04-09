import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  try {
    // Usuário deve ter um partner_id
    if (!user!.partner_id) {
      return NextResponse.json(
        { error: "Usuário não está associado a um parceiro" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Segurança: Clientes SEMPRE usam seu próprio partner_id
    // Apenas admins podem passar partner_id como query param
    let partnerId: string;
    
    if (user!.is_client) {
      // Cliente: SEMPRE usa seu próprio partner_id
      partnerId = user!.partner_id;
    } else {
      // Admin ou outra role: pode usar partner_id do query param ou seu próprio
      partnerId = searchParams.get("partner_id") || user!.partner_id;
    }

    const query = supabase
      .from("user")
      .select(`
        id,
        first_name,
        last_name,
        email,
        is_client,
        partner_id
      `)
      .eq("partner_id", partnerId)
      .eq("is_client", true);

    const { data, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
