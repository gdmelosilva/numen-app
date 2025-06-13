import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(req: NextRequest) {
  const { user_id, project_id, max_hours } = await req.json();
  if (!user_id || !project_id || typeof max_hours !== 'number') {
    return NextResponse.json({ error: 'user_id, project_id e max_hours são obrigatórios' }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('project_resources')
    .update({ max_hours })
    .eq('user_id', user_id)
    .eq('project_id', project_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
