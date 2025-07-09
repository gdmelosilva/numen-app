import { createClient } from '@/lib/supabase/client';
import { Role } from '@/types/roles';
import { MarketingInterface } from '@/types/marketing_segments';

const supabase = await createClient();

export async function getRoleOptions(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*');

  if (error) {
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
      return [];
    }

    return data || [];
}

// Função para opções de categoria
export async function getCategoryOptions(ams: boolean = false): Promise<{ id: string; name: string; description: string }[]> {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .eq('is_ams', ams);

  if (error) {
    return [];
  }
  return data ?? [];
}

// Função para opções de prioridade
export async function getPriorityOptions(): Promise<{
  id: string; name: string 
}[]> {
  const { data, error } = await supabase
    .from('ticket_priorities')
    .select('*');

  if (error) {
    return [];
  }
  return data ?? [];
}

// Função para opções de módulos
export async function getModuleOptions(): Promise<{
  id: string; name: string; description: string 
}[]> {
  const { data, error } = await supabase
    .from('ticket_modules')
    .select('*');

  if (error) {
    return [];
  }
  return data ?? [];
}

export enum UserRole {
  Admin = 1,
  Manager = 2,
  Functional = 3,
}
