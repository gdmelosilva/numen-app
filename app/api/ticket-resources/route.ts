import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ticket-resources?ticket_id=...
export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const ticket_id = searchParams.get("ticket_id");
  let query = supabase
  .from("ticket_resource")
  .select("*, user:user_id(id, first_name, last_name, email, is_client, is_active)");
  if (ticket_id) {
    query = query.eq("ticket_id", ticket_id);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
