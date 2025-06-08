import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';
import { uploadImageToSupabase } from '../utils/uploadImage';
import { translateSupabaseError } from '../utils/translateSupabaseError';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async function signUpWithEmail(name: string, email: string, password: string, imageUri: string | null) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Erro ao recuperar ID do usuário criado.');

      let avatarUrl: string | null = null;
      if (imageUri) {
        avatarUrl = await uploadImageToSupabase({
          imageUri,
          userId,
          fileName: 'profile.jpg',
          bucket: 'avatars',
        });
      }

      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        name,
        email,
        avatar_url: avatarUrl,
      });

      if (insertError) throw insertError;

      showAlert('Sucesso', 'Conta criada com sucesso!');

      return { userId };
    } catch (err) {
      showAlert('Erro ao criar conta', translateSupabaseError(err));
      throw err;
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://fideliza-web.vercel.app/reset-password'
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  };
}