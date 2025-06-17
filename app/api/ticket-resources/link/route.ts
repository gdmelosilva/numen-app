import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ticket-resources/link
export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id } = body;
  if (!user_id || !ticket_id) {
    return NextResponse.json({ error: "user_id e ticket_id são obrigatórios" }, { status: 400 });
  }
  const { error } = await supabase.from("ticket_resource").insert({ user_id, ticket_id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
