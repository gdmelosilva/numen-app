// pages/api/create-user.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      telephone,
      isClient,
      role,
      partnerId 
    } = await request.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "Numen@2025",
      email_confirm: true,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Usuário não criado");

    await supabase.from('users').insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      email: data.user.email,
      is_client: isClient,
      tel_contact: telephone,
      role: role,
      partner_id: partnerId || null,
    });

    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    });

    return NextResponse.json({ success: true });
  } catch (err: Error | unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
