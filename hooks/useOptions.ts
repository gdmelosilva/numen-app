import { createClient } from '@/lib/supabase/client';
import { Role } from '@/types/roles';
import { MarketingInterface } from '@/types/marketing_segments';

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

export async function getMarketSegments(): Promise<MarketingInterface[] | null> {
  const {data, error} = await supabase
    .from('market_segments')
    .select('*')
    
    if (error) {
      console.error('Error fetching marketing_segments');
    }

    return data || [];
}

export enum UserRole {
  Admin = 1,
  Manager = 2,
  Functional = 3,
}
