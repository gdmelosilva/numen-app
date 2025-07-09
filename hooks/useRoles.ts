import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Role } from '@/types/roles';

const supabase = await createClient();

export const useCreateRole = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = async (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([roleData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cargo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => setError(null);

  return {
    createRole,
    isLoading,
    error,
    resetError,
  };
};

export const useDeleteRoles = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteRoles = async (ids: number[]): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return true;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao deletar cargos');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { 
    deleteRoles, 
    isDeleting, 
    deleteError };
};