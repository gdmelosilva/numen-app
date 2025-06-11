import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");

  if (!project_id) {
    return NextResponse.json({ error: "project_id é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user")
    .select(`
      id,
      first_name,
      last_name,
      email,
      tel_contact,
      is_active,
      role,
      is_client
    `)
    .eq("project_id", project_id)
    .order("first_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
