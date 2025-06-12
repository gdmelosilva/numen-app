import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/partner-resource/projects?user_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) {
    return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 });
  }
  const supabase = await createClient();
  // Busca todos os project_id onde o usuário está alocado
  type ProjectResourceRow = { project_id: string };
  const { data, error } = await supabase
    .from("project_resources")
    .select("project_id")
    .eq("user_id", user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Retorna lista de project_id
  return NextResponse.json((data || []).map((row: ProjectResourceRow) => row.project_id));
}
