import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Extrai o ticket_id do path params
  const { pathname } = new URL(request.url);
  // O path será algo como /api/smartbuild/tickets/<ticket_id>
  const pathParts = pathname.split("/");
  const ticket_id = pathParts[pathParts.length - 1];

  if (!ticket_id) {
    return NextResponse.json({ error: "ticket_id é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket")
    .select(`
      id,
      external_id,
      title,
      description,
      hours,
      is_closed,
      is_private,
      created_at,
      updated_at,
      planned_end_date,
      actual_end_date,
      category_id,
      type_id,
      module_id,
      status_id,
      priority_id,
      partner_id,
      project_id,
      created_by,
      category:fk_category(id, name),
      type:fk_type(id, name),
      module:fk_module(id, name),
      status:fk_status(id, name),
      priority:fk_priority(id, name),
      partner:fk_partner(id, partner_desc),
      project:fk_project(id, projectName),
      created_by_user:ticket_created_by_fkey(id, first_name, last_name)
    `)
    .eq("id", ticket_id)
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ? { data } : { data: null });
}
