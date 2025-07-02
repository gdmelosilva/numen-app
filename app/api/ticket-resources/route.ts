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

// PUT /api/ticket-resources
export async function PUT(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id, is_main } = body;

  if (!user_id || !ticket_id || typeof is_main !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ticket_resource")
    .update({ is_main })
    .eq("user_id", user_id)
    .eq("ticket_id", ticket_id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/ticket-resources
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

// DELETE /api/ticket-resources
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id } = body;
  if (!user_id || !ticket_id) {
    return NextResponse.json({ error: "user_id e ticket_id são obrigatórios" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ticket_resource")
    .delete()
    .eq("user_id", user_id)
    .eq("ticket_id", ticket_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}