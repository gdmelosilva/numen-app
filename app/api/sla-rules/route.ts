import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";
import { CreateSlaRuleRequest } from "@/types/sla_rules";

export async function GET(request: NextRequest) {
  // Autenticar usuário
  const { error } = await authenticateRequest();
  if (error) return error;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Filtros opcionais
    const projectId = searchParams.get('project_id');
    const weekdayId = searchParams.get('weekday_id');
    const priorityId = searchParams.get('priority_id');
    const statusId = searchParams.get('status_id');
    const categoryId = searchParams.get('ticket_category_id');

    let query = supabase
      .from('sla_rules')
      .select(`
        id,
        created_at,
        project_id,
        ticket_category_id,
        priority_id,
        status_id,
        weekday_id,
        sla_hours,
        updated_at,
        warning
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros se fornecidos
    if (projectId) query = query.eq('project_id', projectId);
    if (weekdayId) query = query.eq('weekday_id', parseInt(weekdayId));
    if (priorityId) query = query.eq('priority_id', parseInt(priorityId));
    if (statusId) query = query.eq('status_id', parseInt(statusId));
    if (categoryId) query = query.eq('ticket_category_id', parseInt(categoryId));

    const { data, error: queryError } = await query;

    if (queryError) {
      console.error('Erro ao buscar regras SLA:', queryError);
      return NextResponse.json(
        { error: 'Erro ao buscar regras SLA' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para criar regras SLA (Admin, Gerente)
  const roleCheck = requireRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER])(user!);
  if (roleCheck) return roleCheck;

  try {
    const body: CreateSlaRuleRequest = await request.json();

    // Validação básica
    if (!body.project_id) {
      return NextResponse.json(
        { error: 'project_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error: insertError } = await supabase
      .from('sla_rules')
      .insert({
        project_id: body.project_id,
        ticket_category_id: body.ticket_category_id,
        priority_id: body.priority_id,
        status_id: body.status_id,
        weekday_id: body.weekday_id,
        sla_hours: body.sla_hours,
        warning: body.warning ?? false, // Valor padrão false se não fornecido
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar regra SLA:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar regra SLA' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}