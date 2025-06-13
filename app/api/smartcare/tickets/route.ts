import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/smartcare/tickets?project_id=...
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'Parâmetro project_id é obrigatório.' }, { status: 400 });
  }
  try {
    // Busca tickets vinculados ao projeto AMS (ajuste o nome das tabelas/relacionamentos conforme seu schema)
    const { data, error } = await supabase
      .from('ticket')
      .select('*')
      .eq('project_id', projectId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar tickets do projeto.' }, { status: 500 });
  }
}
