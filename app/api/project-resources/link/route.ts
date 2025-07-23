import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { project_id, user_id, max_hours, user_functional, hora_faturavel } = body;
    if (!project_id || !user_id || !max_hours || !user_functional) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    // Verifica se já existe vínculo
    const { data: existing, error: findError } = await supabase
      .from('project_resources')
      .select('id')
      .eq('project_id', project_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) {
      return NextResponse.json({ error: 'Usuário já vinculado ao projeto.' }, { status: 409 });
    }

    // Cria vínculo
    const { error } = await supabase
      .from('project_resources')
      .insert({
        project_id,
        user_id,
        max_hours,
        user_functional, // id do módulo
        hora_faturavel: hora_faturavel !== null && hora_faturavel !== undefined ? hora_faturavel : null,
      });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao vincular usuário.';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
