import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const useUsersForFilter = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('user')
        .select('id, first_name, last_name, email')
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};
