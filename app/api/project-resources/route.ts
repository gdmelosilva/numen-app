import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/project-resources?project_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  
  if (!project_id) {
    return NextResponse.json({ error: 'project_id é obrigatório' }, { status: 400 });
  }
  
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_resources')
    .select('user_id, is_suspended')
    .eq('project_id', project_id);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
