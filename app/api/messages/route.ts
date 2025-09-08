import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Message } from "@/types/messages";
import { authenticateRequest } from "@/lib/api-auth";
import { generateEmailTemplate, TicketUpdatedTemplateData } from "@/lib/email-templates";
import { sendOutlookMail } from "@/lib/sendOutlookMail";

// ===== CONFIGURAÇÃO DE TESTE - REMOVER EM PRODUÇÃO =====
const TEST_MODE = false; // Altere para false para desabilitar o modo de teste
const TEST_EMAIL = "guilherme.rocha@numenit.com"; // Substitua pelo seu email para testes
// ========================================================

// Helper para buscar a última mensagem não privada do ticket
async function getLastPublicMessage(ticketId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: lastMessage } = await supabase
    .from('message')
    .select('body')
    .eq('ticket_id', ticketId)
    .eq('is_private', false)
    .eq('is_system', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return lastMessage?.body || null;
}

// Helper reutilizável para identificar quem deve receber notificações/emails de atualização
async function getRecipientsForTicketUpdate({
  ticketId,
  projectId,
}: {
  ticketId: string;
  projectId: string;
}): Promise<string[]> {
  const supabase = await createClient();
  const recipients = new Set<string>(); // Usar Set para evitar duplicatas

  console.log('DEBUG: Buscando recipients para atualização do ticket:', { ticketId, projectId });

  // 1. Buscar todos os gerentes do cliente específico (via projeto)
  const { data: projectData, error: projectError } = await supabase
    .from('project')
    .select('partnerId')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Erro ao buscar projeto para obter partnerId:', projectError);
  } else if (projectData?.partnerId) {
    // Buscar todos os gerentes (managers) do cliente/parceiro
    const { data: clientManagers, error: managersError } = await supabase
      .from('user')
      .select('id, email, first_name, last_name, role')
      .eq('partner_id', projectData.partnerId)
      .eq('role', '2')
      .eq('is_active', true)
      .not('email', 'is', null);

    if (managersError) {
      console.error('Erro ao buscar gerentes do cliente:', managersError);
    } else {
      clientManagers?.forEach(manager => {
        recipients.add(manager.id);
        console.log(`📨 Adicionado gerente do cliente: ${manager.first_name} ${manager.last_name} (${manager.email})`);
      });
    }
  }

  // 2. Buscar funcionais diretamente atrelados ao chamado (ticket_resource)
  const { data: ticketResources, error: ticketResourceError } = await supabase
    .from('ticket_resource')
    .select(`
      user_id,
      user!inner(
        id,
        email,
        first_name,
        last_name,
        is_client,
        role
      )
    `)
    .eq('ticket_id', ticketId);

  if (ticketResourceError) {
    console.error('Erro ao buscar recursos atrelados ao ticket:', ticketResourceError);
  } else {
    ticketResources?.forEach(resource => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (resource.user as any);
      if (user && !user.is_client) { // Apenas funcionais
        recipients.add(user.id);
        console.log(`📨 Adicionado funcional atrelado ao ticket: ${user.first_name} ${user.last_name} (${user.email})`);
      }
    });
  }

  const recipientIds = Array.from(recipients);
  console.log(`📊 Total de recipients únicos encontrados: ${recipientIds.length}`);
  return recipientIds;
}

// Função para enviar email de atualização de status
async function sendTicketUpdateEmail({
  ticketId,
  ticketExternalId,
  ticketTitle,
  projectId,
  updatedByUserId,
  newStatus,
  previousStatus,
  updateDescription,
}: {
  ticketId: string;
  ticketExternalId?: string;
  ticketTitle: string;
  projectId: string;
  updatedByUserId: string;
  newStatus: string;
  previousStatus: string;
  updateDescription: string;
}) {
  try {
    console.log('DEBUG: Iniciando envio de emails para atualização do ticket:', ticketId);
    
    const supabase = await createClient();

    // Buscar recipients (gerentes do cliente e funcionais atrelados ao chamado)
    const recipientUserIds = await getRecipientsForTicketUpdate({
      ticketId,
      projectId,
    });

    if (recipientUserIds.length === 0) {
      console.warn(`Nenhum recipient encontrado para envio de email do ticket ${ticketId}`);
      return;
    }

    // Buscar dados completos dos usuários (email, nome, etc.) filtrando apenas ativos
    const { data: recipientUsers, error: usersError } = await supabase
      .from('user')
      .select('id, email, first_name, last_name, is_active')
      .in('id', recipientUserIds)
      .eq('is_active', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error('Erro ao buscar dados dos recipients para email:', usersError);
      return;
    }

    if (!recipientUsers || recipientUsers.length === 0) {
      console.warn(`Nenhum usuário ativo com email encontrado para o ticket ${ticketId}`);
      return;
    }

    // ===== MODO DE TESTE - ENVIAR APENAS PARA UM EMAIL =====
    let finalRecipients = recipientUsers;
    if (TEST_MODE && TEST_EMAIL) {
      console.log(`🧪 MODO DE TESTE ATIVADO: Enviando email apenas para ${TEST_EMAIL}`);
      console.log(`📧 Recipients originais: ${recipientUsers.length} usuários`);
      console.log(`📋 Lista original:`, recipientUsers.map(u => `${u.first_name} ${u.last_name} (${u.email})`));
      
      // Criar um recipient fictício com o email de teste
      finalRecipients = [{
        id: 'test-user',
        email: TEST_EMAIL,
        first_name: 'Teste',
        last_name: 'Desenvolvimento',
        is_active: true
      }];
      
      console.log(`✅ Redirecionando todos os emails para: ${TEST_EMAIL}`);
    }
    // =====================================================

    // Buscar informações do projeto e usuário que fez a atualização
    const [projectResult, updatedByResult] = await Promise.all([
      supabase
        .from('project')
        .select(`
          projectName,
          partnerId,
          partner:partnerId ( partner_desc )
        `)
        .eq('id', projectId)
        .single(),
      supabase
        .from('user')
        .select('first_name, last_name')
        .eq('id', updatedByUserId)
        .single()
    ]);

    if (projectResult.error || !projectResult.data) {
      console.error('Erro ao buscar projeto para email:', projectResult.error);
      return;
    }

    if (updatedByResult.error || !updatedByResult.data) {
      console.error('Erro ao buscar usuário que atualizou:', updatedByResult.error);
      return;
    }

    const project = projectResult.data;
    const updatedByUser = updatedByResult.data;
    
    // Preparar dados para o template de email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerName = (project.partner as any)?.partner_desc || 'N/A';
    const updatedByName = `${updatedByUser.first_name || ''} ${updatedByUser.last_name || ''}`.trim() || 'Sistema';
    
    const emailData: TicketUpdatedTemplateData = {
      ticketId,
      ticketExternalId,
      ticketTitle,
      ticketDescription: updateDescription,
      projectName: project.projectName,
      partnerName,
      clientName: updatedByName,
      clientEmail: '',
      updatedBy: updatedByName,
      updateDescription,
      newStatus,
      previousStatus,
    };

    // Gerar template de email
    const emailTemplate = generateEmailTemplate('ticket-updated', emailData);

    // Enviar email para cada recipient
    const emailPromises = finalRecipients.map(async (user) => {
      if (!user.email) {
        console.warn(`Usuário ${user.first_name} ${user.last_name} não possui email cadastrado`);
        return { success: false, user: `${user.first_name} ${user.last_name}`, error: 'Email não cadastrado' };
      }

      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

      try {
        await sendOutlookMail({
          to: user.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });

        console.log(`Email enviado com sucesso para ${fullName} (${user.email})`);
        return { success: true, user: fullName, email: user.email };
      } catch (error) {
        console.error(`Erro ao enviar email para ${fullName}:`, error);
        return { success: false, user: fullName, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Emails processados para ticket ${ticketId}: ${successful.length} enviados, ${failed.length} falharam`);
    console.log(`Recipients encontrados: ${recipientUserIds.length}, com email válido: ${recipientUsers.length}`);
    
    if (TEST_MODE) {
      console.log(`🧪 MODO DE TESTE: Email redirecionado para ${TEST_EMAIL}`);
      console.log(`📊 Estatísticas originais: ${recipientUserIds.length} recipients, ${recipientUsers.length} com email válido`);
    }
    
    if (failed.length > 0) {
      console.error('Falhas no envio de email:', failed);
    }

  } catch (error) {
    console.error('Erro ao processar notificação de email para atualização do ticket:', error);
  }
}

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

  // Se o usuário é cliente, alterar automaticamente o status do ticket para "Enc. para o Atendente" (id = 13)
  // Esta funcionalidade garante que sempre que um cliente enviar uma mensagem, 
  // o chamado será automaticamente direcionado para o atendente responsável
  if (user.is_client) {
    // Buscar o status atual para comparar
    const { data: currentTicket, error: currentTicketError } = await supabase
      .from("ticket")
      .select(`
        id,
        external_id,
        title,
        project_id,
        module_id,
        status_id,
        status:fk_status(name),
        category:fk_category(name)
      `)
      .eq("id", ticket_id)
      .single();

    if (!currentTicketError && currentTicket) {
      const previousStatusId = currentTicket.status_id;
      const newStatusId = 13; // "Enc. para o Atendente"

      const { error: ticketUpdateError } = await supabase
        .from("ticket")
        .update({ 
          status_id: newStatusId,
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

        // Se o status mudou, enviar e-mail de notificação
        if (previousStatusId !== newStatusId) {
          // Buscar nomes dos status
          const [previousStatusResult, newStatusResult] = await Promise.all([
            supabase.from('ticket_status').select('name').eq('id', previousStatusId).single(),
            supabase.from('ticket_status').select('name').eq('id', newStatusId).single()
          ]);

          const previousStatusName = previousStatusResult.data?.name || '';
          const newStatusName = newStatusResult.data?.name || '';

          if (previousStatusName && newStatusName) {
            // Extrair nome da categoria corretamente
            // const categoryData = currentTicket.category as { name: string } | { name: string }[] | null;
            // const categoryStr = Array.isArray(categoryData) ? categoryData[0]?.name : categoryData?.name || null;

            // Buscar a última mensagem não privada do ticket para usar como updateDescription
            const lastMessageBody = await getLastPublicMessage(currentTicket.id);
            const updateDescription = lastMessageBody || `Cliente enviou uma nova mensagem. Status alterado automaticamente de "${previousStatusName}" para "${newStatusName}".`;

            // Usar a mesma função de envio de e-mail do tickets/route.ts
            sendTicketUpdateEmail({
              ticketId: currentTicket.id,
              ticketExternalId: currentTicket.external_id,
              ticketTitle: currentTicket.title,
              projectId: currentTicket.project_id,
              updatedByUserId: user.id,
              newStatus: newStatusName,
              previousStatus: previousStatusName,
              updateDescription,
            }).catch((error: unknown) => {
              console.error('Erro ao enviar email de atualização do ticket:', error);
            });
          }
        }
      }
    }
  }

  return NextResponse.json(data as Message);
}
