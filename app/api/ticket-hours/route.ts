import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project_id,
      ticket_id,
      message_id,
      user_id,
      minutes,
      appoint_date,
      appoint_start,
      appoint_end,
    } = body;

    if (!project_id || !ticket_id || !message_id || !user_id || !minutes || !appoint_date || !appoint_start || !appoint_end) {
      return NextResponse.json({ error: "Dados obrigatórios faltando." }, { status: 400 });
    }

    // Garante que user_id é sempre string (uuid), nunca objeto
    const userId = typeof user_id === 'object' && user_id !== null && 'id' in user_id
      ? user_id.id
      : user_id;

    // Verificações de negócio antes de permitir o apontamento

    // 1. Verificar se o usuário está ativo
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (!userData.is_active) {
      return NextResponse.json({ error: "Usuário está suspenso/inativo e não pode apontar horas." }, { status: 403 });
    }    // 2. Verificar se o usuário está vinculado ao projeto
    const { data: projectResources, error: projectResourcesError } = await supabase
      .from('project_resources')
      .select('user_id, is_suspended')
      .eq('project_id', project_id)
      .eq('user_id', userId);

    if (projectResourcesError) {
      return NextResponse.json({ error: "Erro ao verificar vinculação ao projeto." }, { status: 500 });
    }

    if (!projectResources || projectResources.length === 0) {
      return NextResponse.json({ error: "Usuário não está vinculado a este projeto." }, { status: 403 });
    }

    const userResource = projectResources[0];
    if (userResource.is_suspended) {
      return NextResponse.json({ error: "Usuário está suspenso neste projeto e não pode apontar horas." }, { status: 403 });
    }

    // 3. Verificar se as horas do contrato foram extrapoladas
    const { data: contractData, error: contractError } = await supabase
      .from('project')
      .select('hours_max')
      .eq('id', project_id)
      .single();

    if (contractError) {
      return NextResponse.json({ error: "Erro ao verificar dados do contrato." }, { status: 500 });
    }

    if (contractData?.hours_max) {
      // Buscar horas já apontadas pelo usuário no projeto
      const { data: existingHours, error: hoursError } = await supabase
        .from('ticket_hours')
        .select('minutes')
        .eq('project_id', project_id)
        .eq('user_id', userId);

      if (hoursError) {
        return NextResponse.json({ error: "Erro ao verificar horas existentes." }, { status: 500 });
      }

      const totalMinutesUsed = (existingHours || []).reduce((sum, item) => sum + (item.minutes ?? 0), 0);
      const totalHoursUsed = totalMinutesUsed / 60;
      const newTotalHours = totalHoursUsed + (minutes / 60);

      if (newTotalHours > contractData.hours_max) {
        return NextResponse.json({ 
          error: `Apontamento excede o limite de horas do contrato. Limite: ${contractData.hours_max}h, Já utilizado: ${totalHoursUsed.toFixed(2)}h, Tentativa de adicionar: ${(minutes / 60).toFixed(2)}h` 
        }, { status: 403 });
      }
    }

    // Se passou por todas as validações, pode inserir o apontamento
    const { data, error } = await supabase.from("ticket_hours").insert([
      {
        project_id,
        ticket_id,
        message_id,
        user_id: userId,
        minutes,
        appoint_date,
        appoint_start,
        appoint_end,
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Erro desconhecido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const message_id = searchParams.get("message_id");
    const user_id = searchParams.get("user_id");
    const project_id = searchParams.get("project_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    // Permite busca flexível: por message_id, user_id, project_id, ou todos
    let query = supabase.from("ticket_hours")
      .select("*, project:project_id(projectName, projectDesc)");
    if (message_id) query = query.eq("message_id", message_id);
    if (user_id) query = query.eq("user_id", user_id);
    if (project_id) query = query.eq("project_id", project_id);
    // Novo: filtro por ano e mês
    if (year && month) {
      // appoint_date no formato YYYY-MM-DD
      const monthStr = String(month).padStart(2, '0');
      const start = `${year}-${monthStr}-01`;
      // Pega último dia do mês
      const endDate = new Date(Number(year), Number(month), 0); // month já é 1-based
      const end = `${year}-${monthStr}-${String(endDate.getDate()).padStart(2, '0')}`;
      query = query.gte('appoint_date', start).lte('appoint_date', end);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Erro desconhecido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}