import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project_id,
      ticket_id,
      message_id,
      user_id,
      minutes,
      appoint_date,
      appoint_start,
      appoint_end,
    } = body;

    if (!project_id || !ticket_id || !message_id || !user_id || !minutes || !appoint_date || !appoint_start || !appoint_end) {
      return NextResponse.json({ error: "Dados obrigatórios faltando." }, { status: 400 });
    }

    // Garante que user_id é sempre string (uuid), nunca objeto
    const userId = typeof user_id === 'object' && user_id !== null && 'id' in user_id
      ? user_id.id
      : user_id;

    const { data, error } = await supabase.from("ticket_hours").insert([
      {
        project_id,
        ticket_id,
        message_id,
        user_id: userId,
        minutes,
        appoint_date,
        appoint_start,
        appoint_end,
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Erro desconhecido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
