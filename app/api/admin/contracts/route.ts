import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper to map DB row to frontend Project type
// Use unknown instead of any for row type
// Use Record<string, unknown> instead of any
type ProjectStatus = {
  id?: string;
  name?: string;
  color?: string;
};

function mapProjectRow(row: unknown) {
  const r = row as Record<string, unknown>;
  const projectStatus = r.project_status as ProjectStatus | undefined;
  return {
    id: r.id,
    projectExtId: r.projectExtId?.toString() ?? "",
    projectName: r.projectName ?? "",
    projectDesc: r.projectDesc ?? "",
    partnerId: r.partnerId ?? "",
    partner_name: r.partner_name ?? "",
    project_type: r.project_type ?? "",
    project_status: projectStatus
      ? {
          id: projectStatus.id ?? "",
          name: projectStatus.name ?? "",
          color: projectStatus.color ?? "",
        }
      : { id: "", name: "" },
    is_wildcard: r.is_wildcard,
    is_247: r.is_247,
    start_date: r.start_date
      ? new Date(r.start_date as string).toISOString()
      : "",
    end_at: r.end_at ? new Date(r.end_at as string).toISOString() : "",
    // Campos de cobrança
    hours_max: r.hours_max ?? null,
    cred_exp_period: r.cred_exp_period ?? null,
    value_hr_normal: r.value_hr_normal ?? null,
    value_hr_excdn: r.value_hr_excdn ?? null,
    value_hr_except: r.value_hr_except ?? null,
    value_hr_warn: r.value_hr_warn ?? null,
    baseline_hours: r.baseline_hours ?? null,
    opening_time: r.opening_time ?? null,
    closing_time: r.closing_time ?? null,
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from("project")
    .select(
      "id, projectExtId, projectName, projectDesc, partnerId, project_type, project_status:fk_project_status(id, name, color), is_wildcard, is_247, start_date, end_at, hours_max, cred_exp_period, value_hr_normal, value_hr_excdn, value_hr_except, value_hr_warn, baseline_hours, opening_time, closing_time, partner_name:fk_project_partner(partner_desc)",
      { count: "exact" },
    );

  // Filtering
  if (searchParams.get("id")) {
    query = query.eq("id", searchParams.get("id"));
  }
  if (searchParams.get("projectExtId")) {
    query = query.eq("projectExtId", searchParams.get("projectExtId"));
  }
  if (searchParams.get("projectName")) {
    query = query.ilike("projectName", `%${searchParams.get("projectName")}%`);
  }
  if (searchParams.get("projectDesc")) {
    query = query.ilike("projectDesc", `%${searchParams.get("projectDesc")}%`);
  }
  if (searchParams.get("partnerId")) {
    query = query.eq("partnerId", searchParams.get("partnerId"));
  }
  if (searchParams.get("project_type")) {
    query = query.eq("project_type", searchParams.get("project_type"));
  }
  if (searchParams.get("project_status")) {
    query = query.eq("project_status", searchParams.get("project_status"));
  }
  if (searchParams.get("is_wildcard") !== null) {
    const val = searchParams.get("is_wildcard");
    if (val === "true" || val === "false")
      query = query.eq("is_wildcard", val === "true");
  }
  if (searchParams.get("is_247") !== null) {
    const val = searchParams.get("is_247");
    if (val === "true" || val === "false")
      query = query.eq("is_247", val === "true");
  }
  if (searchParams.get("start_date")) {
    query = query.gte("start_date", searchParams.get("start_date"));
  }
  if (searchParams.get("end_at")) {
    query = query.lte("end_at", searchParams.get("end_at"));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map DB rows to frontend shape
  const projects = (data || []).map(mapProjectRow);
  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    // Only allow certain fields
    const {
      projectName,
      projectDesc,
      partnerId,
      project_type,
      project_status,
      is_wildcard,
      is_247,
      start_date,
      end_at,
    } = body;
    // Insert into DB
    const { data, error } = await supabase
      .from("project")
      .insert([
        {
          projectName,
          projectDesc,
          partnerId,
          project_type,
          project_status,
          is_wildcard,
          is_247,
          start_date: start_date ? new Date(start_date).toISOString() : null,
          end_at: end_at ? new Date(end_at).toISOString() : null,
        },
      ])
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data?.[0] ?? {}, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar projeto" },
      { status: 500 },
    );
  }
}
