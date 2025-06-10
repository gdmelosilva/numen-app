import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function activatePartner(partnerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('partner')
      .update({ is_active: true })
      .eq('id', partnerId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

export async function deactivatePartner(partnerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('partner')
      .update({ is_active: false })
      .eq('id', partnerId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}
