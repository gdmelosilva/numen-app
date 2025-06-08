import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const active = searchParams.get("active");

    const supabase = await createClient();
    let query = supabase
      .from("user")
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
        { error: "Erro ao buscar usuários" },
        { status: 500 }
      );
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 