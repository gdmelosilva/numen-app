import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase (ajuste as variáveis conforme seu ambiente)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/smartcare/users?project_id=...
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'Parâmetro project_id é obrigatório.' }, { status: 400 });
  }
  try {
    // Busca project_resources e faz join com user via foreign key
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        id,
        user_id,
        project_id,
        max_hours,
        user_functional,
        is_suspended,
        user:user_id (
          id,
          first_name,
          last_name,
          email,
          is_verified,
          is_active,
          is_client,
          tel_contact,
          role,
          created_at,
          updated_at,
          partner_id
        )
      `)
      .eq('project_id', projectId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Extrai os dados dos usuários junto com os dados de project_resources
    const users = (data || []).map((row) => ({
      ...row.user,
      is_suspended: row.is_suspended,
      max_hours: row.max_hours,
      user_functional: row.user_functional,
      project_resource_id: row.id
    }));
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuários do projeto.' }, { status: 500 });
  }
}
