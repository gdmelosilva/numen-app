import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Banimento eterno: public.user e auth.users
export async function banUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Atualiza public.user
    const { error: userError } = await supabase
      .from('user')
      .update({ is_active: false })
      .eq('id', userId);
    if (userError) return { success: false, error: userError.message };

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

export async function unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Atualiza public.user
    const { error: userError } = await supabase
      .from('user')
      .update({ is_active: true })
      .eq('id', userId);
    if (userError) return { success: false, error: userError.message };

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}