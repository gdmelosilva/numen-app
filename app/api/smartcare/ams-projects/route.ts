import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, USER_ROLES } from "@/lib/api-auth";

// GET /api/smartcare/ams-projects
export async function GET() {
  // Autentica usuário
  const { user, error } = await authenticateRequest();
  if (error || !user) return error;

  const supabase = await createClient();

  let query = supabase
    .from("project")
    .select("*, partner:partnerId(*)", { count: "exact" })
    .eq("project_type", "AMS");

  if (!user.is_client) {
    if (user.role === USER_ROLES.ADMIN) {
      // Admin: retorna todos os projetos AMS
      // Nada a filtrar
    } else if (user.role === USER_ROLES.MANAGER) {
      // Manager: retorna projetos AMS onde está alocado (project_resources)
      const { data: projectIds, error: prjErr } = await supabase
        .from("project_resources")
        .select("project_id")
        .eq("user_id", user.id);
      if (prjErr) {
        return NextResponse.json({ error: prjErr.message }, { status: 500 });
      }
      const ids = (projectIds || []).map((row: { project_id: string }) => row.project_id);
      if (ids.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      query = query.in("id", ids);
    }
  } else {
    // Client: retorna o único projeto AMS do seu partner_id
    if (!user.partner_id) {
      return NextResponse.json([], { status: 200 });
    }
    query = query.eq("partnerId", user.partner_id);
  }

  const { data, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  // Map only the fields needed by the frontend
  interface AMSProject {
    id: string;
    projectExtId?: string;
    projectName: string;
    projectDesc?: string;
    partnerId: string;
    partner?: Record<string, unknown> | null;
    project_type: string;
    project_status?: string | number | null;
    is_wildcard?: boolean | null;
    is_247?: boolean | null;
    start_date?: string | null;
    end_at: string;
    hours_max?: number | null;
    cred_exp_period?: number | null;
    value_hr_normal?: number | null;
    value_hr_excdn?: number | null;
    value_hr_except?: number | null;
    value_hr_warn?: number | null;
    baseline_hours?: number | null;
    opening_time?: string | null;
    closing_time?: string | null;
  }
  const result = (data || []).map((row: AMSProject) => ({
    id: row.id,
    projectExtId: row.projectExtId ?? "",
    projectName: row.projectName,
    projectDesc: row.projectDesc ?? "",
    partnerId: row.partnerId,
    partner: row.partner ?? null,
    project_type: row.project_type,
    project_status: row.project_status ?? null,
    is_wildcard: row.is_wildcard ?? null,
    is_247: row.is_247 ?? null,
    start_date: row.start_date ?? null,
    end_at: row.end_at,
    hours_max: row.hours_max ?? null,
    cred_exp_period: row.cred_exp_period ?? null,
    value_hr_normal: row.value_hr_normal ?? null,
    value_hr_excdn: row.value_hr_excdn ?? null,
    value_hr_except: row.value_hr_except ?? null,
    value_hr_warn: row.value_hr_warn ?? null,
    baseline_hours: row.baseline_hours ?? null,
    opening_time: row.opening_time ?? null,
    closing_time: row.closing_time ?? null,
  }));
  return NextResponse.json(result);
}

// PUT /api/smartcare/ams-projects/close
export async function PUT(req: NextRequest) {
  const { user, error } = await authenticateRequest();
  if (error || !user) return error;

  if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.MANAGER) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID do projeto é obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  // Atualiza o status para 'Encerrado' e end_at para agora
  const { error: updateError } = await supabase
    .from("project")
    .update({ project_status: 5, end_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
