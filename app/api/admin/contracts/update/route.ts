import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { id, projectName, projectDesc, partnerId, project_type, project_status, is_wildcard, is_247, start_date, end_at } = body;
    if (!id) {
      return NextResponse.json({ error: "ID do projeto é obrigatório" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("project")
      .update({
        projectName,
        projectDesc,
        partnerId,
        project_type,
        project_status,
        is_wildcard,
        is_247,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        end_at: end_at ? new Date(end_at).toISOString() : null,
      })
      .eq("id", id)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data?.[0] ?? {}, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 });
  }
}
