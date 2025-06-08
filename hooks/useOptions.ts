import { createClient } from '@/lib/supabase/client';
import { Role } from '@/types/roles';

const supabase = await createClient();

export async function getRoleOptions(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*');

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
  
  return data || [];
}

export async function getRoleById(id: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}