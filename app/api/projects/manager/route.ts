import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/api-auth';

// GET /api/projects/manager?project_id=xxx
export async function GET(req: NextRequest) {
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  
  if (!project_id) {
    return NextResponse.json({ error: 'project_id é obrigatório' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  try {
    // Buscar usuários que são gerentes do projeto usando a API atualizada
    const { data: projectResources, error: resourceError } = await supabase
      .from('project_resources')
      .select(`
        user_id,
        user_functional,
        users!inner(
          id,
          email,
          first_name,
          last_name,
          is_client,
          role
        )
      `)
      .eq('project_id', project_id)
      .eq('is_suspended', false);

    if (resourceError) {
      console.error('Erro ao buscar recursos do projeto:', resourceError);
      return NextResponse.json({ error: resourceError.message }, { status: 500 });
    }

    // Filtrar apenas gerentes que não são clientes (is_client = false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managers = projectResources?.filter((resource: any) => {
      const userRecord = resource.users;
      return (
        userRecord && 
        !userRecord.is_client && 
        (resource.user_functional === 2 || userRecord.role === 2) // Assumindo que 2 = Manager
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).map((resource: any) => ({
      id: resource.users.id,
      email: resource.users.email,
      first_name: resource.users.first_name,
      last_name: resource.users.last_name,
      full_name: `${resource.users.first_name || ''} ${resource.users.last_name || ''}`.trim()
    })) || [];

    return NextResponse.json({ managers });
    
  } catch (error) {
    console.error('Erro ao buscar gerente do projeto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
