"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/components/user-context";

export interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  text: string;
  action_url?: string;
  created_at: string;
  read: boolean;
  is_pinned?: boolean;
  delivered_at?: string;
}

export function useNotifications() {
  const { user } = useUserContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Função para buscar contagem de não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications?action=count');
      if (!response.ok) throw new Error('Erro ao buscar contagem');
      
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [user]);

  // Função para buscar lista de notificações
  const fetchNotifications = useCallback(async (limit = 20) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notifications?action=list&limit=${limit}`);
      if (!response.ok) throw new Error('Erro ao buscar notificações');
      
      const data = await response.json();
      setNotifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Função para marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notification_id: notificationId,
        }),
      });

      if (!response.ok) throw new Error('Erro ao marcar como lida');

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      // Atualizar contagem
      await fetchUnreadCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [user, fetchUnreadCount]);

  // Função para marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (!response.ok) throw new Error('Erro ao marcar todas como lidas');

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      // Atualizar contagem
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [user]);

  // Função para dispensar (remover) notificação
  const dismissNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss',
          notification_id: notificationId,
        }),
      });

      if (!response.ok) throw new Error('Erro ao dispensar notificação');

      // Remover do estado local
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      // Atualizar contagem se era não lida
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        await fetchUnreadCount();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [user, notifications, fetchUnreadCount]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Configurar real-time updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    let pollingInterval: NodeJS.Timeout | null = null;
    
    // Canal para mudanças em notification_recipients (quando alguém marca como lida/dispensada)
    const recipientsChannel = supabase
      .channel(`notification_recipients_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Recarregar dados quando houver mudanças
          setTimeout(() => {
            fetchNotifications();
            fetchUnreadCount();
          }, 100); // Pequeno delay para garantir que a transação foi commitada
        }
      )
      .on('system', { event: 'CHANNEL_SUBSCRIBE' }, () => {
        setIsRealtimeConnected(true);
      })
      .on('system', { event: 'CHANNEL_ERROR' }, () => {
        setIsRealtimeConnected(false);
        startPolling();
      })
      .subscribe();

    // Canal para novas notificações (inserções na tabela notification_recipients)
    const notificationsChannel = supabase
      .channel(`new_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Recarregar dados imediatamente para novas notificações
          setTimeout(() => {
            fetchNotifications();
            fetchUnreadCount();
          }, 100);
        }
      )
      .subscribe();

    // Função para iniciar polling como fallback
    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      
      // Starting polling fallback
      pollingInterval = setInterval(() => {
        // Polling for notifications...
        fetchNotifications();
        fetchUnreadCount();
      }, 30000); // Poll a cada 30 segundos
    };

    // Iniciar polling após 5 segundos se real-time não conectar
    const timeoutId = setTimeout(() => {
      if (!isRealtimeConnected) {
        // Realtime not connected after 5s, starting polling fallback
        startPolling();
      }
    }, 5000);

    // Cleanup
    return () => {
      // Cleaning up realtime subscriptions
      clearTimeout(timeoutId);
      if (pollingInterval) clearInterval(pollingInterval);
      supabase.removeChannel(recipientsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, fetchNotifications, fetchUnreadCount, isRealtimeConnected]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isRealtimeConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refetch: () => {
      fetchNotifications();
      fetchUnreadCount();
    },
  };
}
