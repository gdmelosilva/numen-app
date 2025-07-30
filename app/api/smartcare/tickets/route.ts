import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/smartcare/tickets?project_id=...
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id');
  console.log('SmartCare Tickets API called with project_id:', projectId);
  
  if (!projectId) {
    console.error('Missing project_id parameter');
    return NextResponse.json({ error: 'Parâmetro project_id é obrigatório.' }, { status: 400 });
  }
  
  try {
    console.log('Executing Supabase query for project:', projectId);
    // Adicionando mais foreign keys para completar os dados necessários
    const { data, error } = await supabase
      .from('ticket')
      .select(`
        id,
        external_id,
        title,
        description,
        hours,
        is_closed,
        is_private,
        created_at,
        updated_at,
        planned_end_date,
        actual_end_date,
        category_id,
        type_id,
        module_id,
        status_id,
        priority_id,
        partner_id,
        project_id,
        created_by,
        category:fk_category(id, name),
        type:fk_type(id, name),
        module:fk_module(id, name),
        status:fk_status(id, name, color),
        priority:fk_priority(id, name),
        partner:fk_partner(id, partner_desc),
        project:fk_project(id, projectName),
        created_by_user:ticket_created_by_fkey(id, first_name, last_name),
        ticket_resource(user_id, ticket_id, is_main, user:user_id(id, first_name, last_name, email, is_client, is_active))
      `)
      .order("created_at", { ascending: false })
      .eq('project_id', projectId)
      .eq('type_id', 1);  // SmartCare AMS é sempre type_id = 1
      
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Query successful, returning data:', data?.length || 0, 'tickets');
    console.log('Sample data:', data?.slice(0, 2)); // Log dos primeiros 2 tickets como exemplo
    
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: 'Erro ao buscar tickets do projeto.' }, { status: 500 });
  }
}
