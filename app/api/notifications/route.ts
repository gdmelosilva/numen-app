import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface NotificationData {
  id: string;
  title: string;
  body: string | null;
  severity: string | null;
  type: string | null;
  action_url: string | null;
  created_at: string;
  is_pinned: boolean | null;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'count': {
        // Buscar contagem de notificações não lidas
        const { data: countRow, error: countError } = await supabase
          .from('v_user_unread_counts')
          .select('unread_count')
          .eq('user_id', user.id)
          .single();

        if (countError && countError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw countError;
        }

        const unread = countRow?.unread_count ?? 0;
        return NextResponse.json({ unread_count: unread });
      }

      case 'list':
      default: {
        // Buscar lista de notificações
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const { data: items, error: listError } = await supabase
          .from('notification_recipients')
          .select(`
            read_at, dismissed_at, delivered_at,
            notifications:notification_id (
              id, title, body, severity, type, action_url, created_at, is_pinned
            )
          `)
          .eq('user_id', user.id)
          .is('dismissed_at', null)
          .order('read_at', { ascending: true, nullsFirst: true })
          .order('delivered_at', { ascending: false })
          .limit(limit);

        if (listError) {
          throw listError;
        }

        // Transformar os dados para o formato esperado pelo frontend
        const notifications = (items || []).map(item => {
          // O Supabase retorna o relacionamento como um objeto único quando usamos notification_id
          const notification = Array.isArray(item.notifications) 
            ? item.notifications[0] 
            : item.notifications;
          
          if (!notification) return null;

          return {
            id: (notification as NotificationData).id,
            type: (notification as NotificationData).type || 'info',
            severity: (notification as NotificationData).severity || 'low',
            title: (notification as NotificationData).title,
            text: (notification as NotificationData).body || '',
            action_url: (notification as NotificationData).action_url,
            created_at: (notification as NotificationData).created_at,
            read: !!item.read_at,
            is_pinned: (notification as NotificationData).is_pinned || false,
            delivered_at: item.delivered_at,
          };
        }).filter(Boolean);

        return NextResponse.json(notifications);
      }
    }
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, severity, title, body: notificationBody, action_url, data, created_by, recipients } = body;

    // Validar campos obrigatórios
    if (!type || !title || !created_by) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: type, title, created_by' }, 
        { status: 400 }
      );
    }

    // Criar a notificação
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type,
        severity: severity || 'info',
        title,
        body: notificationBody || null,
        action_url: action_url || null,
        data: data || {},
        created_by
      })
      .select()
      .single();

    if (notificationError) {
      throw notificationError;
    }

    // Se recipients foram especificados, criar os registros na tabela notification_recipients
    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      const recipientRecords = recipients.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
        delivered_at: new Date().toISOString()
      }));

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipientRecords);

      if (recipientError) {
        console.error('Erro ao criar recipients:', recipientError);
        // Não falha a criação da notificação, apenas loga o erro
      }
    } else {
      // Se não foram especificados recipients, criar para o próprio criador
      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert({
          notification_id: notification.id,
          user_id: created_by,
          delivered_at: new Date().toISOString()
        });

      if (recipientError) {
        console.error('Erro ao criar recipient para o criador:', recipientError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      notification_id: notification.id 
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, notification_id } = body;

    switch (action) {
      case 'mark_read': {
        if (!notification_id) {
          return NextResponse.json(
            { error: 'notification_id é obrigatório' }, 
            { status: 400 }
          );
        }

        // Marcar como lida
        const { error: updateError } = await supabase
          .from('notification_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('notification_id', notification_id)
          .is('read_at', null);

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_all_read': {
        // Marcar todas como lidas
        const { error: updateError } = await supabase
          .from('notification_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null)
          .is('dismissed_at', null);

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ success: true });
      }

      case 'dismiss': {
        if (!notification_id) {
          return NextResponse.json(
            { error: 'notification_id é obrigatório' }, 
            { status: 400 }
          );
        }

        // Marcar como dispensada (remover da lista)
        const { error: updateError } = await supabase
          .from('notification_recipients')
          .update({ dismissed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('notification_id', notification_id);

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    );
  }
}
