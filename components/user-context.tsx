"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthenticatedUser } from "@/lib/api-auth";

interface UserContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          if (!ignore) setUser(null);
          setLoading(false);
          return;
        }
        const { data: userData } = await supabase
          .from('user')
          .select('id, email, role, partner_id, is_active, is_client, first_name, last_name')
          .eq('id', authUser.id)
          .single();
        if (!ignore) setUser(userData || null);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    return () => { ignore = true; };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within a UserProvider");
  return ctx;
}
