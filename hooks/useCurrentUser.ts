import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthenticatedUser } from "@/lib/api-auth";

// Cache global para evitar múltiplas chamadas simultâneas
let userCache: AuthenticatedUser | null = null;
let userCachePromise: Promise<AuthenticatedUser | null> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

async function fetchUserData(): Promise<AuthenticatedUser | null> {
  const now = Date.now();
  
  // Se há uma busca em andamento, aguarda ela
  if (userCachePromise) {
    return userCachePromise;
  }
  
  // Se o cache é recente, retorna ele
  if (userCache && (now - lastFetchTime) < CACHE_DURATION) {
    return userCache;
  }
  
  // Inicia nova busca
  userCachePromise = (async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        userCache = null;
        lastFetchTime = now;
        return null;
      }
      
      const { data: userData } = await supabase
        .from('user')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      userCache = userData ?? null;
      lastFetchTime = now;
      return userCache;
    } catch {
      userCache = null;
      lastFetchTime = now;
      return null;
    } finally {
      userCachePromise = null;
    }
  })();
  
  return userCachePromise;
}

export function useCurrentUser() {
  const [user, setUser] = useState<AuthenticatedUser | null>(userCache);
  const [loading, setLoading] = useState(userCache === null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const userData = await fetchUserData();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  return { user, loading };
}
