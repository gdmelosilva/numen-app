import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "ID do apontamento é obrigatório." }, { status: 400 });
    }

    // Verificar se o apontamento existe e obter informações do usuário
    const { data: existingRecord, error: fetchError } = await supabase
      .from('ticket_hours')
      .select('id, user_id, project_id, is_deleted')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Apontamento não encontrado." }, { status: 404 });
    }

    // Verificar se já está deletado
    if (existingRecord.is_deleted) {
      return NextResponse.json({ error: "Este apontamento já foi excluído." }, { status: 400 });
    }

    // Aqui você pode adicionar verificações de permissão se necessário
    // Por exemplo, verificar se o usuário pode excluir este apontamento
    // baseado no role ou se é o próprio usuário que criou o apontamento

    // Preparar dados para atualização
    const updateData: Record<string, boolean | string> = {};
    
    if ('is_deleted' in body) {
      updateData.is_deleted = body.is_deleted;
      
      // Se está marcando como deletado, adicionar timestamp
      if (body.is_deleted === true) {
        updateData.deleted_at = new Date().toISOString();
      }
    }

    // Permitir outras atualizações futuras
    if ('is_approved' in body) {
      updateData.is_approved = body.is_approved;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização." }, { status: 400 });
    }

    // Atualizar o registro
    const { data, error } = await supabase
      .from('ticket_hours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const action = body.is_deleted ? "excluído" : "atualizado";
    return NextResponse.json({ 
      success: true, 
      message: `Apontamento ${action} com sucesso.`,
      data 
    });

  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Erro desconhecido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "ID do apontamento é obrigatório." }, { status: 400 });
    }

    // Verificar se o apontamento existe
    const { data: existingRecord, error: fetchError } = await supabase
      .from('ticket_hours')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Apontamento não encontrado." }, { status: 404 });
    }

    // Fazer soft delete em vez de hard delete
    const { data, error } = await supabase
      .from('ticket_hours')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Apontamento excluído com sucesso.",
      data 
    });

  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Erro desconhecido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
