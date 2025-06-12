import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { id, projectName, projectDesc, partnerId, project_type, project_status, is_wildcard, is_247, start_date, end_at,
      hours_max, cred_exp_period, value_hr_normal, value_hr_excdn, value_hr_except, value_hr_warn, baseline_hours, opening_time, closing_time
    } = body;
    if (!id) {
      return NextResponse.json({ error: "ID do projeto é obrigatório" }, { status: 400 });
    }
    // Se for AMS, atualiza campos de cobrança; caso contrário, zera
    const updateData: Record<string, unknown> = {
      projectName,
      projectDesc,
      partnerId,
      project_type,
      project_status,
      is_wildcard,
      is_247,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      end_at: end_at ? new Date(end_at).toISOString() : null,
      opening_time,
      closing_time,
    };
    if (project_type === "AMS") {
      updateData.hours_max = hours_max;
      updateData.cred_exp_period = cred_exp_period;
      updateData.value_hr_normal = value_hr_normal;
      updateData.value_hr_excdn = value_hr_excdn;
      updateData.value_hr_except = value_hr_except;
      updateData.value_hr_warn = value_hr_warn;
      updateData.baseline_hours = baseline_hours;
    } else {
      updateData.hours_max = null;
      updateData.cred_exp_period = null;
      updateData.value_hr_normal = null;
      updateData.value_hr_excdn = null;
      updateData.value_hr_except = null;
      updateData.value_hr_warn = null;
      updateData.baseline_hours = null;
    }
    const { data, error } = await supabase
      .from("project")
      .update(updateData)
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
