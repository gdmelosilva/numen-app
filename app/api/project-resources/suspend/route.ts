import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(req: NextRequest) {
  const { id, is_suspended } = await req.json();
  if (!id || typeof is_suspended !== 'boolean') {
    return NextResponse.json({ error: 'id e is_suspended são obrigatórios' }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('project_resources')
    .update({ is_suspended })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
