import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    const partner_id = searchParams.get("partner_id");    console.log("Tickets API called with project_id:", project_id, "partner_id:", partner_id);

    const supabase = await createClient();
  let query = supabase
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
    .order("created_at", { ascending: false })
    .eq("type_id", 2);  if (project_id) {
    // Handle multiple project IDs separated by commas
    // URL decode the project_id first in case it's URL encoded
    const decodedProjectId = decodeURIComponent(project_id);
    const projectIds = decodedProjectId.split(',').map(id => id.trim()).filter(id => id);
    
    console.log("Processed project IDs:", projectIds);
    
    if (projectIds.length === 1) {
      query = query.eq("project_id", projectIds[0]);
    } else if (projectIds.length > 1) {
      query = query.in("project_id", projectIds);
    }
  }
  if (partner_id) {
    query = query.eq("partner_id", partner_id);
  }

  // Remover filtro fk_type_id do filterableFields, pois agora é obrigatório
  const filterableFields = [
    "external_id",
    "title",
    "status_id",
    "priority_id",
    "type_id",
    "category_id",
    "is_closed",
    "created_at",
    "planned_end_date",
    "actual_end_date"
  ];
  filterableFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  });
  const { data, error } = await query;

  if (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
