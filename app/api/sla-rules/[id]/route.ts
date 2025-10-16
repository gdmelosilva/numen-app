import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, requireRole, USER_ROLES } from "@/lib/api-auth";
import { UpdateSlaRuleRequest } from "@/types/sla_rules";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Autenticar usuário
  const { error } = await authenticateRequest();
  if (error) return error;

  try {
    const supabase = await createClient();
    const { data, error: queryError } = await supabase
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
      .eq('id', parseInt((await params).id))
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Regra SLA não encontrada' },
          { status: 404 }
        );
      }
      console.error('Erro ao buscar regra SLA:', queryError);
      return NextResponse.json(
        { error: 'Erro ao buscar regra SLA' },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para atualizar regras SLA (Admin, Gerente)
  const roleCheck = requireRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER])(user!);
  if (roleCheck) return roleCheck;

  try {
    const body: UpdateSlaRuleRequest = await request.json();
    const supabase = await createClient();

    // Construir objeto de update apenas com campos fornecidos
    const updateData: Partial<UpdateSlaRuleRequest> = {
      updated_at: new Date().toISOString(),
    };

    if (body.ticket_category_id !== undefined) updateData.ticket_category_id = body.ticket_category_id;
    if (body.priority_id !== undefined) updateData.priority_id = body.priority_id;
    if (body.status_id !== undefined) updateData.status_id = body.status_id;
    if (body.weekday_id !== undefined) updateData.weekday_id = body.weekday_id;
    if (body.sla_hours !== undefined) updateData.sla_hours = body.sla_hours;
    if (body.warning !== undefined) updateData.warning = body.warning;

    const { data, error: updateError } = await supabase
      .from('sla_rules')
      .update(updateData)
      .eq('id', parseInt(params.id))
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Regra SLA não encontrada' },
          { status: 404 }
        );
      }
      console.error('Erro ao atualizar regra SLA:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar regra SLA' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Autenticar usuário
  const { user, error } = await authenticateRequest();
  if (error) return error;

  // Verificar se tem permissão para deletar regras SLA (Admin, Gerente)
  const roleCheck = requireRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER])(user!);
  if (roleCheck) return roleCheck;

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from('sla_rules')
      .delete()
      .eq('id', parseInt(params.id));

    if (deleteError) {
      console.error('Erro ao deletar regra SLA:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar regra SLA' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Regra SLA deletada com sucesso' });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}