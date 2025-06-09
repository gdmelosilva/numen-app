import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthenticatedUser } from "@/lib/api-auth";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        const { data: userData } = await supabase
          .from('user')
          .select('id, email, role, partner_id, is_client, first_name, last_name')
          .eq('id', authUser.id)
          .single();
        setUser(userData || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading };
}
