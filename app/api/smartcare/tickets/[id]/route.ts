import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const serverSupabase = await createServerClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar perfil do usuário para verificar se não é cliente
    const { data: profile, error: profileError } = await serverSupabase
      .from('user')
      .select('is_client')
      .eq('id', user.id)
      .single();

    console.log('Profile check:', { profile, profileError, userId: user.id });

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return NextResponse.json({ error: 'Erro ao verificar perfil do usuário' }, { status: 500 });
    }

    if (profile?.is_client) {
      return NextResponse.json({ error: 'Acesso negado - usuários clientes não podem editar tickets' }, { status: 403 });
    }

    const body = await request.json();
    const { category_id, module_id, priority_id } = body;

    console.log('Request body:', { category_id, module_id, priority_id });

    // Preparar dados para atualização
    const updateData: Record<string, string | number> = {};
    
    if (category_id !== undefined) {
      updateData.category_id = Number(category_id);
    }
    if (module_id !== undefined) {
      updateData.module_id = Number(module_id);
    }
    if (priority_id !== undefined) {
      updateData.priority_id = Number(priority_id);
    }

    // Sempre incluir updated_by com o ID do usuário autenticado
    updateData.updated_by = user.id;

    console.log('Update data:', updateData);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
    }

    // Verificar se o ticket existe e não está finalizado
    const { data: ticketCheck, error: checkError } = await supabase
      .from('ticket')
      .select('id, status:fk_status(name)')
      .eq('id', id)
      .single();

    if (checkError || !ticketCheck) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }

    // Verificar se o ticket não está finalizado
    const status = ticketCheck.status as { name: string } | { name: string }[] | null;
    const statusName = Array.isArray(status) ? status[0]?.name : status?.name;
    
    if (statusName === 'Finalizado') {
      return NextResponse.json({ error: 'Não é possível editar um ticket finalizado' }, { status: 400 });
    }

    // Atualizar o ticket
    const { data, error } = await supabase
      .from('ticket')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ticket:', error);
      return NextResponse.json({ error: 'Erro ao atualizar ticket' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ticket atualizado com sucesso', data });
  } catch (error) {
    console.error('Erro no endpoint PATCH:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
