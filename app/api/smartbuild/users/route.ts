import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");

  if (!project_id) {
    return NextResponse.json({ error: "project_id é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  // Busca usuários alocados no projeto via project_resources
  const { data, error } = await supabase
    .from("project_resources")
    .select(`user:id, user!inner(id, first_name, last_name, email, tel_contact, is_active, role, is_client)`)
    .eq("project_id", project_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extrai apenas os dados dos usuários
  type ProjectResourceRow = { user: { id: string; first_name: string; last_name: string; email: string; tel_contact: string; is_active: boolean; role: number; is_client: boolean } };
  const users = (data || []).map((row: ProjectResourceRow) => row.user);
  return NextResponse.json(users);
}
