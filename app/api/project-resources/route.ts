import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/project-resources?project_id=xxx&user_functional=manager
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  const user_id = searchParams.get('user_id');
  const user_functional = searchParams.get('user_functional');
  
  if (!project_id && !user_id) {
    return NextResponse.json({ error: 'project_id ou user_id é obrigatório' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  let query = supabase
    .from('project_resources')
    .select(`
      user_id, 
      project_id, 
      is_suspended, 
      user_functional,
      user!inner(
        id,
        email,
        first_name,
        last_name,
        is_client,
        role
      )
    `);
  
  if (project_id) {
    query = query.eq('project_id', project_id);
  }
  
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  
  // Filtrar por função do usuário (ex: manager)
  if (user_functional === 'manager') {
    // Assumindo que gerentes têm user_functional específico ou role = 2
    query = query.or('user_functional.eq.2,user.role.eq.2');
  }
  
  const { data, error } = await query;
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data || []);
}
