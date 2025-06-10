import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const auth = await authenticateRequest();
    if (auth.error) {
      return NextResponse.json(
        { error: typeof auth.error === 'string' ? auth.error : 'Authentication failed' },
        { status: 401 }
      );
    }
    if (!auth.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Only admin can unlink
    const roleCheck = requireRole([USER_ROLES.ADMIN])(auth.user);
    if (roleCheck) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { userId, partnerId } = await request.json();

    if (!userId || !partnerId) {
      return NextResponse.json(
        { error: "Dados insuficientes." },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("user")
      .update({ partner_id: null })
      .eq("id", userId)
      .eq("partner_id", partnerId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao desvincular usuário:", err);
    return NextResponse.json(
      { error: "Erro ao desvincular usuário." },
      { status: 500 }
    );
  }
}