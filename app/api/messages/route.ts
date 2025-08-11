import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Message } from "@/types/messages";
import { authenticateRequest } from "@/lib/api-auth";

// Função auxiliar para buscar recipients de notificação quando status é alterado
async function getNotificationRecipients(ticketId: string): Promise<string[]> {
  const supabase = await createClient();
  const recipients = new Set<string>();

  try {
    // Buscar informações do ticket para obter project_id e category
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        id,
        project_id,
        external_id,
        category_id,
        ticket_categories:category_id (name)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket para notificação:', ticketError);
      return [];
    }

    // 1. Buscar usuários vinculados ao chamado (ticket_resource)
    const { data: ticketResources, error: resourcesError } = await supabase
      .from('ticket_resource')
      .select(`
        user_id,
        user:user_id!inner(
          id,
          is_active,
          is_client
        )
      `)
      .eq('ticket_id', ticketId);

    if (!resourcesError && ticketResources) {
      ticketResources.forEach(resource => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = resource.user as any;
        if (user?.is_active) {
          recipients.add(resource.user_id);
        }
      });
    }

    // 2. Buscar gerentes do projeto
    const { data: projectResources, error: projectError } = await supabase
      .from('project_resources')
      .select(`
        user_id,
        user!inner(
          id,
          is_active,
          is_client,
          role
        )
      `)
      .eq('project_id', ticket.project_id)
      .eq('user_functional', 2) // 2 = Manager
      .eq('is_suspended', false);

    if (!projectError && projectResources) {
      projectResources.forEach(resource => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = resource.user as any;
        if (user?.is_active && !user?.is_client) {
          recipients.add(resource.user_id);
        }
      });
    }

    // 3. Buscar usuários clientes do parceiro do contrato
    const { data: project, error: partnerError } = await supabase
      .from('project')
      .select('"partnerId"')
      .eq('id', ticket.project_id)
      .single();

    if (!partnerError && project?.partnerId) {
      const { data: partnerUsers, error: usersError } = await supabase
        .from('user')
        .select('id')
        .eq('partner_id', project.partnerId)
        .eq('is_client', true)
        .eq('is_active', true);

      if (!usersError && partnerUsers) {
        partnerUsers.forEach(user => recipients.add(user.id));
      }
    }

    return Array.from(recipients);
  } catch (error) {
    console.error('Erro ao buscar recipients para notificação:', error);
    return [];
  }
}

// Função auxiliar para criar notificação de alteração de status
async function createStatusChangeNotification(ticketId: string, createdBy: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Buscar informações do ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        id,
        external_id,
        title,
        category_id,
        ticket_categories:category_id (name)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket para criar notificação:', ticketError);
      return;
    }

    // Buscar recipients
    const recipients = await getNotificationRecipients(ticketId);
    
    if (recipients.length === 0) {
      console.log('Nenhum recipient encontrado para notificação de status');
      return;
    }

    // Criar a notificação
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'ALERT',
        severity: 'info',
        title: 'Status do Chamado Alterado',
        body: `O chamado #${ticket.external_id} foi encaminhado para o atendente`,
        action_url: `/main/smartcare/management/${ticket.external_id}`,
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (notificationError) {
      console.error('Erro ao criar notificação de status:', notificationError);
      return;
    }

    // Criar recipients da notificação
    const recipientRecords = recipients.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
    }));

    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .insert(recipientRecords);

    if (recipientError) {
      console.error('Erro ao criar recipients da notificação:', recipientError);
    } else {
      console.log(`Notificação de status criada para ${recipients.length} usuários`);
    }
  } catch (error) {
    console.error('Erro na função createStatusChangeNotification:', error);
  }
}

// GET: Lista todas as mensagens de um ticket (por ticket_id)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticket_id = searchParams.get("ticket_id");
  const ref_msg_id = searchParams.get("ref_msg_id");
  const system_only = searchParams.get("system_only");
  const status_only = searchParams.get("status_only");

  if (!ticket_id && !ref_msg_id) {
    return NextResponse.json({ error: "ticket_id ou ref_msg_id é obrigatório" }, { status: 400 });
  }

  // Autentica o usuário para verificar se é client
  const { user, error: authError } = await authenticateRequest();
  if (authError) {
    return authError;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Monta a query dinâmica
  let query = supabase
    .from("message")
    .select(`id, ext_id, body, hours, is_private, created_at, created_by, ticket_id, status_id, user:created_by(id, first_name, last_name, is_client), is_system, ref_msg_id, status:status_id(id, name, stage)`)
    .order("created_at", { ascending: true });

  if (ref_msg_id) {
    query = query.eq("ref_msg_id", ref_msg_id);
    if (ticket_id) {
      query = query.eq("ticket_id", ticket_id);
    }
  } else if (ticket_id) {
    query = query.eq("ticket_id", ticket_id);
  }

  // Filtro para mensagens do sistema apenas
  if (system_only === "true") {
    query = query.eq("is_system", true);
  }

  // Filtro para mensagens que possuem status
  if (status_only === "true") {
    query = query.not("status_id", "is", null);
  }

  // Se o usuário é cliente, filtrar apenas mensagens não-privadas
  if (user.is_client) {
    query = query.eq("is_private", false);
  }

  const { data: messagesData, error: messagesError } = await query;
    
  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }
  // Busca anexos das mensagens
  const messageIds = (messagesData || []).map(msg => msg.id);
  let attachmentsData: { id: string; name: string; path: string; message_id: string }[] = [];
  
  if (messageIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from("attachment")
      .select("id, name, path, message_id")
      .in("message_id", messageIds);
      
    if (!attachmentsError) {
      attachmentsData = attachments || [];
    }
  }

  // Busca horas para mensagens do sistema (ref_msg_id)
  // Mapeia: ref_msg_id (da mensagem do sistema) -> id da mensagem original
  const systemMsgRefIds: string[] = (messagesData || [])
    .filter((msg: { is_system?: boolean; ref_msg_id?: string }) => msg.is_system && typeof msg.ref_msg_id === 'string')
    .map((msg: { ref_msg_id?: string }) => msg.ref_msg_id!)
    .filter(Boolean);

  // systemHoursMap: id da mensagem original -> horas
  const systemHoursMap: Record<string, number> = {};
  if (systemMsgRefIds.length > 0) {
    // Busca ticket_hours dessas mensagens originais
    const { data: hoursData, error: hoursErr } = await supabase
      .from("ticket_hours")
      .select("message_id, minutes")
      .in("message_id", systemMsgRefIds);
    if (!hoursErr && hoursData) {
      for (const refId of systemMsgRefIds) {
        const totalMinutes = hoursData
          .filter((h: { message_id: string }) => h.message_id === refId)
          .reduce((sum: number, h: { minutes?: number }) => sum + (h.minutes ?? 0), 0);
        systemHoursMap[refId] = totalMinutes / 60;
      }
    }
  }

  // Corrige o formato do campo user para ser um objeto (não array) e une o nome e adiciona anexos
  const messages = (messagesData || []).map((msg: Record<string, unknown>) => {
    let user = { name: '', is_client: false };
    if (Array.isArray(msg.user) && msg.user[0]) {
      const u = msg.user[0] as { first_name?: string; last_name?: string; id?: string; is_client?: boolean };
      user = { ...u, name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(), is_client: !!u.is_client };
    } else if (msg.user && typeof msg.user === 'object') {
      const u = msg.user as { first_name?: string; last_name?: string; id?: string; is_client?: boolean };
      user = { ...u, name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(), is_client: !!u.is_client };
    }
    // Adiciona anexos da mensagem
    const messageAttachments = attachmentsData.filter(att => att.message_id === msg.id);
    // Adiciona system_hours se for mensagem do sistema
    let system_hours = null;
    if (msg.is_system && typeof msg.ref_msg_id === 'string' && systemHoursMap[msg.ref_msg_id] !== undefined) {
      system_hours = systemHoursMap[msg.ref_msg_id];
    }
    // Retorna todos os campos originais + user corrigido + anexos + system_hours
    return {
      ...msg,
      user,
      attachments: messageAttachments,
      ref_msg_id: msg.ref_msg_id, // garante que o campo é retornado
      system_hours,
    } as unknown as Message & { system_hours?: number };
  });
  return NextResponse.json(messages as (Message & { system_hours?: number })[]);
}

// POST: Cria uma nova mensagem
export async function POST(req: NextRequest) {
  // Autentica e pega o usuário logado
  const { user, error: authError } = await authenticateRequest();
  if (authError) {
    return authError;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const { ticket_id, body: msgBody, hours, is_private, status_id } = body;
  
  if (!ticket_id || !msgBody) {
    return NextResponse.json({ error: "ticket_id e body são obrigatórios" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verificações de negócio antes de permitir o envio da mensagem

  // 1. Verificar se o usuário está ativo
  if (!user.is_active) {
    return NextResponse.json({ error: "Usuário está suspenso/inativo e não pode enviar mensagens." }, { status: 403 });
  }

  // 2. Buscar informações do ticket para obter o project_id
  const { data: ticketData, error: ticketError } = await supabase
    .from('ticket')
    .select('project_id')
    .eq('id', ticket_id)
    .single();

  if (ticketError || !ticketData) {
    return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
  }

  // 3. Para usuários clientes, verificar se o ticket é do parceiro correto
  // if (user.is_client) {
  //   // Buscar o partner_id do projeto
  //   const { data: projectData, error: projectError } = await supabase
  //     .from('project')
  //     .select('partner_id')
  //     .eq('id', ticketData.project_id)
  //     .single();

  //   if (projectError || !projectData) {
  //     return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
  //   }

  //   if (String(projectData.partner_id) !== String(user.partner_id)) {
  //     return NextResponse.json({ error: "Usuário não pertence ao parceiro deste contrato e não pode enviar mensagens." }, { status: 403 });
  //   }
  // }

  // Se passou por todas as validações, pode inserir a mensagem
  const { data, error } = await supabase
    .from("message")
    .insert([
      {
        ticket_id,
        body: msgBody,
        hours: hours ?? null,
        is_private: !!is_private,
        // Só envia status_id se for number
        ...(typeof status_id === 'number' ? { status_id } : {}),
        created_by: user.id, // sempre string do id do usuário autenticado
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[POST /api/messages] Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Se o usuário é cliente, alterar automaticamente o status do ticket para "Enc. para o Atendente" (id = 3)
  // Esta funcionalidade garante que sempre que um cliente enviar uma mensagem, 
  // o chamado será automaticamente direcionado para o atendente responsável
  if (user.is_client) {
    const { error: ticketUpdateError } = await supabase
      .from("ticket")
      .update({ 
        status_id: 3, // "Enc. para o Atendente"
        updated_by: user.id 
      })
      .eq("id", ticket_id);

    if (ticketUpdateError) {
      console.error("[POST /api/messages] Erro ao atualizar status do ticket:", ticketUpdateError);
      // Não falhamos a criação da mensagem por causa do erro de atualização do status
      // Apenas logamos o erro para análise posterior
    } else {
      // Se a atualização do status foi bem-sucedida, criar notificação
      createStatusChangeNotification(ticket_id, user.id).catch(error => {
        console.error("Erro ao criar notificação de alteração de status:", error);
      });
    }
  }

  return NextResponse.json(data as Message);
}
