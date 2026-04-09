import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { authenticateRequest } from "@/lib/api-auth";
import { sendOutlookMail } from "@/lib/send-mail";
import { generateEmailTemplate, EmailTemplateData } from "@/lib/email-templates";

// ===== CONFIGURAÇÃO DE TESTE - REMOVER EM PRODUÇÃO =====
const TEST_MODE = false; // Altere para false para desabilitar o modo de teste
const TEST_EMAIL = "guilherme.rocha@numenit.com"; // Substitua pelo seu email para testes
// ========================================================

// Helper para notificações de CLIENTES - apenas criador e responsável
async function getRecipientsForClientTicket({
  createdBy,
  responsibleId,
}: {
  createdBy: string;
  responsibleId: string | null;
}): Promise<string[]> {
  const recipients = new Set<string>();

  console.log('DEBUG: Buscando recipients para cliente:', { createdBy, responsibleId });

  // Adicionar sempre o criador do ticket
  if (createdBy) {
    recipients.add(createdBy);
    console.log(`✅ Criador do ticket adicionado aos recipients: ${createdBy}`);
  }

  // Adicionar o responsável selecionado se existir e for diferente do criador
  if (responsibleId && responsibleId !== createdBy) {
    recipients.add(responsibleId);
    console.log(`✅ Responsável adicionado aos recipients: ${responsibleId}`);
  }

  const recipientsList = Array.from(recipients);
  console.log(`📊 Total de recipients encontrados: ${recipientsList.length}`);
  
  return recipientsList;
}

// Helper para notificações de FUNCIONAIS - lógica original com todos os critérios
async function getRecipientsForTicket({
  projectId,
  moduleId,
  categoryName,
}: {
  projectId: string;
  moduleId: number;
  categoryName: string | null;
}): Promise<string[]> {
  const supabase = await createClient();
  const recipients = new Set<string>(); // Usar Set para evitar duplicatas
  const isIncident = categoryName === 'Incidente';

  console.log('DEBUG: Buscando recipients (funcional):', { projectId, moduleId, categoryName, isIncident });

  // 1. Buscar gerentes administrativos do projeto
  const { data: projectResources, error: resourceError } = await supabase
    .from('project_resources')
    .select(`
      user_id,
      user_functional,
      user!inner(
        id,
        email,
        first_name,
        last_name,
        is_client,
        role
      )
    `)
    .eq('project_id', projectId)
    .eq('user_functional', 3)
    .eq('is_suspended', false);

  if (resourceError) {
    console.error('Erro ao buscar recursos do projeto para recipients:', resourceError);
  } else {
    // Filtrar apenas gerentes administrativos (não clientes e com role/functional = 2)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managers = projectResources?.filter((resource: any) => {
      const userRecord = resource.user;
      return (
        userRecord && 
        !userRecord.is_client && 
        (resource.user_functional === 2 || userRecord.role === 2) // role 2 = Manager
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).map((resource: any) => resource.user.id) || [];

    managers.forEach(managerId => recipients.add(managerId));
    console.log(`Adicionados ${managers.length} gerentes administrativos aos recipients`);
  }

  // 2. Buscar informações do projeto para obter o parceiro
  const { data: project, error: projectError } = await supabase
    .from('project')
    .select('"partnerId"')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Erro ao buscar informações do projeto:', projectError);
  } else if (project?.partnerId) {
    // Buscar todos os usuários clientes do parceiro
    const { data: partnerUsers, error: partnerUsersError } = await supabase
      .from('user')
      .select('id')
      .eq('partner_id', project.partnerId)
      .eq('is_client', true)
      .eq('is_active', true);

    if (partnerUsersError) {
      console.error('Erro ao buscar usuários do parceiro:', partnerUsersError);
    } else {
      partnerUsers?.forEach(user => recipients.add(user.id));
      console.log(`Adicionados ${partnerUsers?.length || 0} usuários clientes do parceiro aos recipients`);
    }
  }

  // 3. Se for incidente, buscar recursos do projeto do mesmo módulo
  if (isIncident) {
    // Buscar recursos do projeto que estão no mesmo módulo do ticket
    const { data: moduleResources, error: moduleResourcesError } = await supabase
      .from('project_resources')
      .select(`
        user_id,
        user!inner(
          id,
          is_active
        )
      `)
      .eq('project_id', projectId)
      .eq('is_suspended', false);

    if (moduleResourcesError) {
      console.error('Erro ao buscar recursos do módulo:', moduleResourcesError);
    } else {
      // Buscar quais usuários têm acesso ao módulo específico através de ticket_resources
      const { data: moduleTickets, error: moduleTicketsError } = await supabase
        .from('ticket')
        .select(`
          id,
          ticket_resource(
            user_id,
            user:user_id(id, is_active)
          )
        `)
        .eq('project_id', projectId)
        .eq('module_id', moduleId)
        .not('ticket_resource', 'is', null);

      if (!moduleTicketsError && moduleTickets) {
        const moduleUserIds = new Set<string>();
        moduleTickets.forEach(ticket => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ticket.ticket_resource?.forEach((resource: any) => {
            if (resource.user?.is_active) {
              moduleUserIds.add(resource.user_id);
            }
          });
        });

        // Adicionar apenas usuários que são recursos do projeto E trabalham no módulo
        moduleResources?.forEach(projectResource => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userRecord = projectResource.user as any;
          if (userRecord?.is_active && moduleUserIds.has(projectResource.user_id)) {
            recipients.add(projectResource.user_id);
          }
        });

        console.log(`Adicionados ${moduleUserIds.size} recursos do módulo ${moduleId} aos recipients (incidente)`);
      }

      // Fallback: se não encontrou usuários específicos do módulo, adicionar todos os recursos ativos do projeto
      if (moduleTickets?.length === 0) {
        moduleResources?.forEach(projectResource => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userRecord = projectResource.user as any;
          if (userRecord?.is_active) {
            recipients.add(projectResource.user_id);
          }
        });
        console.log(`Fallback: Adicionados todos os recursos ativos do projeto aos recipients (incidente sem histórico do módulo)`);
      }
    }
  }

  const recipientsList = Array.from(recipients);
  console.log(`Total de recipients encontrados: ${recipientsList.length}`);
  
  return recipientsList;
}

// Função auxiliar para criar notificação para CLIENTES
async function createTicketNotificationForClient(ticketData: {
  ticketId: string;
  categoryName: string | null;
  userName: string;
  userId: string;
  responsibleId: string | null;
}) {
  console.log('DEBUG: createTicketNotificationForClient iniciada com dados:', ticketData);
  
  try {
    const { categoryName, userName, userId, ticketId, responsibleId } = ticketData;
    
    console.log('DEBUG: Extraindo dados para notificação (cliente):', {
      categoryName,
      userName,
      userId,
      ticketId,
      responsibleId
    });
    
    // Determinar severidade baseada na categoria
    const severity = categoryName === 'Incidente' ? 'warning' : 'info';
    const supabase = await createClient();

    // Usar o helper para buscar recipients (criador e responsável)
    const recipientsList = await getRecipientsForClientTicket({
      createdBy: userId,
      responsibleId,
    });

    if (recipientsList.length === 0) {
      console.warn('Nenhum recipient encontrado para a notificação do ticket:', ticketId);
      return;
    }
    
    console.log('DEBUG: Recipients para notificação (cliente):', recipientsList);
    console.log('DEBUG: Criando notificação para ticket:', ticketId);
    
    // Criar a notificação diretamente no banco de dados (sem API HTTP)
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'ALERT',
        severity,
        title: 'Novo Chamado Aberto',
        body: `Um(a) novo(a) ${categoryName || 'chamado'} foi aberto por ${userName}`,
        action_url: `/main/smartcare/management/${ticketId}`,
        created_by: userId,
      })
      .select('id')
      .single();

    console.log('DEBUG: Resultado da criação de notificação:', { notification, notificationError });

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
      return;
    }

    console.log('DEBUG: Notificação criada com ID:', notification?.id);

    // Criar os recipients da notificação
    const recipientRecords = recipientsList.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
    }));

    console.log('DEBUG: Records de recipients:', recipientRecords);

    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .insert(recipientRecords);

    console.log('DEBUG: Resultado da criação de recipients:', { recipientError });

    if (recipientError) {
      console.error('Erro ao criar recipients da notificação:', recipientError);
    } else {
      console.log(`Notificação criada com sucesso para o ticket: ${ticketId}`);
      console.log(`Total de recipients: ${recipientsList.length}`);
      console.log(`Tipo de chamado: ${categoryName || 'N/A'} (${categoryName === 'Incidente' ? 'INCIDENTE' : 'NORMAL'})`);
    }
  } catch (error) {
    console.error('Erro ao criar notificação para ticket:', error);
  }
}

// Função auxiliar para criar notificação para FUNCIONAIS
async function createTicketNotification(ticketData: {
  ticketId: string;
  categoryName: string | null;
  userName: string;
  userId: string;
  projectId: string;
  moduleId: number;
}) {
  console.log('DEBUG: createTicketNotification iniciada com dados:', ticketData);
  
  try {
    const { categoryName, userName, userId, ticketId, projectId, moduleId } = ticketData;
    
    console.log('DEBUG: Extraindo dados para notificação (funcional):', {
      categoryName,
      userName,
      userId,
      ticketId,
      projectId,
      moduleId
    });
    
    // Determinar severidade baseada na categoria
    const severity = categoryName === 'Incidente' ? 'warning' : 'info';
    const supabase = await createClient();

    // Usar o helper para buscar recipients
    const recipientsList = await getRecipientsForTicket({
      projectId,
      moduleId,
      categoryName,
    });

    if (recipientsList.length === 0) {
      console.warn('Nenhum recipient encontrado para a notificação do ticket:', ticketId);
      return;
    }
    
    console.log('DEBUG: Recipients para notificação (funcional):', recipientsList);
    console.log('DEBUG: Criando notificação para ticket:', ticketId);
    
    // Criar a notificação diretamente no banco de dados (sem API HTTP)
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'ALERT',
        severity,
        title: 'Novo Chamado Aberto',
        body: `Um(a) novo(a) ${categoryName || 'chamado'} foi aberto por ${userName}`,
        action_url: `/main/smartcare/management/${ticketId}`,
        created_by: userId,
      })
      .select('id')
      .single();

    console.log('DEBUG: Resultado da criação de notificação:', { notification, notificationError });

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
      return;
    }

    console.log('DEBUG: Notificação criada com ID:', notification?.id);
    console.log('DEBUG: Criando recipients...');

    // Criar os recipients da notificação
    const recipientRecords = recipientsList.map(userId => ({
      notification_id: notification.id,
      user_id: userId,
    }));

    console.log('DEBUG: Records de recipients:', recipientRecords);

    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .insert(recipientRecords);

    console.log('DEBUG: Resultado da criação de recipients:', { recipientError });

    if (recipientError) {
      console.error('Erro ao criar recipients da notificação:', recipientError);
    } else {
      console.log(`Notificação criada com sucesso para o ticket: ${ticketId}`);
      console.log(`Total de recipients: ${recipientsList.length}`);
      console.log(`Tipo de chamado: ${categoryName || 'N/A'} (${categoryName === 'Incidente' ? 'INCIDENTE' : 'NORMAL'})`);
    }
  } catch (error) {
    console.error('Erro ao criar notificação para ticket:', error);
  }
}

// Função auxiliar para enviar notificação por email para CLIENTES
async function notifyByEmailForClient({
  ticketId,
  ticketExternalId,
  ticketTitle,
  ticketDescription,
  categoryName,
  clientName,
  clientEmail,
  projectId,
  createdBy,
  responsibleId,
}: {
  ticketId: string;
  ticketExternalId?: string;
  ticketTitle: string;
  ticketDescription: string;
  categoryName: string | null;
  clientName: string;
  clientEmail: string;
  projectId: string;
  createdBy: string;
  responsibleId: string | null;
}) {
  try {
    console.log('DEBUG: Iniciando envio de emails para cliente do ticket:', ticketId);
    
    const supabase = await createClient();

    // Usar o helper para buscar recipients (criador e responsável)
    const recipientUserIds = await getRecipientsForClientTicket({
      createdBy,
      responsibleId,
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

    // Buscar informações do projeto para o email
    const { data: project, error: projectError } = await supabase
      .from('project')
      .select(`
        projectName,
        partnerId,
        partner:partnerId ( partner_desc )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Erro ao buscar projeto para email:', projectError);
      return;
    }

    // Preparar dados para o template de email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerName = (project.partner as any)?.partner_desc || 'N/A';
    
    const emailData: EmailTemplateData = {
      ticketId,
      ticketExternalId,
      ticketTitle,
      ticketDescription,
      projectName: project.projectName,
      partnerName,
      clientName,
      clientEmail,
      categoryName: categoryName || undefined
    };

    // Gerar template de email
    const emailTemplate = generateEmailTemplate('ticket-created', emailData);

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
    console.error('Erro ao processar notificação de email para ticket (cliente):', error);
  }
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Detecta se é multipart/form-data
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {    const formData = await req.formData();
    const contractId = formData.get("contractId") as string;
    const partner_id = formData.get("partner_id") as string | null;
    const title = formData.get("title") as string;
    const category_id = formData.get("category_id") as string;
    const module_id = formData.get("module_id") as string;
    const priority_id = formData.get("priority_id") as string;
    const description = formData.get("description") as string;    
    const type_id = formData.get("type_id") as string;
    const attachment = formData.get("file") as File | null;
    const ref_ticket_id = formData.get("ref_ticket_id") as string | null;
    const ref_external_id = formData.get("ref_external_id") as string | null;
    // Extrair responsável selecionado
    const responsibleId = formData.get("responsible_id") as string | null;

    console.log('DEBUG API FormData - category_id recebido:', category_id);    // Validação detalhada dos campos obrigatórios (FormData)
    const missingFields = [];
    if (!contractId) missingFields.push('contractId');
    if (!partner_id) missingFields.push('partner_id');
    if (!title) missingFields.push('title');
    // category_id é opcional (só obrigatório para type_id = 2 - SmartBuild)
    if (!module_id) missingFields.push('module_id');
    if (!priority_id) missingFields.push('priority_id');
    if (!description) missingFields.push('description');
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Campo(s) obrigatório(s) faltando: ${missingFields.join(', ')}` }, { status: 400 });
    }    // Cria o ticket
    const { data: ticket, error } = await supabase
      .from("ticket")
      .insert([
        {
          project_id: contractId,
          partner_id,
          title,
          category_id: category_id ? Number(category_id) : null,
          module_id: Number(module_id),
          priority_id: Number(priority_id),
          description,
          type_id: type_id ? Number(type_id) : 1, // Usa o type_id enviado ou 1 como padrão
          status_id: 1, // Pendente ou status inicial padrão
          is_closed: false,
          is_private: false,
          created_by: user.id,
          updated_by: user.id, // Incluir updated_by na criação
          ref_ticket_id: ref_ticket_id || null,
          ref_external_id: ref_external_id || null,
          responsible: responsibleId || null,
        },
      ])
      .select('*, external_id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se o usuário que criou o ticket for functional-adm, vinculá-lo automaticamente como responsável principal
    if (ticket?.id && user.role === 3) { // role 3 = functional
      console.log('DEBUG: Vinculando usuário functional como recurso principal:', {
        user_id: user.id,
        ticket_id: ticket.id,
        user_role: user.role,
        is_client: user.is_client
      });
      
      try {
        const { error: resourceError } = await supabase
          .from("ticket_resource")
          .insert({
            user_id: user.id,
            ticket_id: ticket.id,
            is_main: true
          });

        if (resourceError) {
          console.error('Erro ao vincular usuário functional como recurso:', resourceError);
          // Não falha a criação do ticket por causa disso, apenas loga o erro
        } else {
          console.log('DEBUG: Usuário functional vinculado com sucesso como recurso principal');
        }
      } catch (err) {
        console.error('Erro ao vincular usuário functional como recurso:', err);
      }
    }

    // Se houver anexo, faz upload e cria registro na tabela attachment
    if (attachment && ticket?.id) {
      const fileExt = attachment.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${ticket.id}/${fileName}`;
      // Upload para o bucket do Supabase
      const { error: uploadError } = await supabase.storage
        .from("numen-bucket")
        .upload(filePath, attachment, { contentType: attachment.type });
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
      // Insere registro na tabela attachment
      const insertData = {
        path: filePath,
        name: attachment.name,
        mime_type: attachment.type,
        uploaded_at: new Date().toISOString(),
        att_type: formData.get("att_type") as string | undefined,
      };
      const { error: dbError } = await supabase.from("attachment").insert(insertData);
      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    }
    
    // Após criar o ticket com sucesso, verificar se deve enviar notificação por email
    if (ticket?.id && user.is_client) {
      // Buscar nome da categoria para o email
      let categoryName: string | null = null;
      if (category_id) {
        try {
          const { data: categoryData } = await supabase
            .from('ticket_categories')
            .select('name')
            .eq('id', Number(category_id))
            .single();
          categoryName = categoryData?.name || null;
        } catch (error) {
          console.warn('Erro ao buscar categoria para email:', error);
        }
      }

      // Disparar notificação para o criador e o responsável selecionado
      const emailNotificationData = {
        ticketId: ticket.id.toString(),
        ticketExternalId: ticket.external_id,
        ticketTitle: title,
        ticketDescription: description,
        categoryName,
        clientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Cliente',
        clientEmail: user.email || '',
        projectId: contractId,
        createdBy: user.id,
        responsibleId: responsibleId || null,
      };

      // Chamar função de notificação de forma assíncrona para não bloquear a resposta
      notifyByEmailForClient(emailNotificationData).catch((error: unknown) => {
        console.error('Erro ao enviar notificação por email (cliente):', error);
      });
    }

    // Criar notificação no sistema para o ticket criado
    if (ticket?.id) {
      console.log('DEBUG: Iniciando criação de notificação para ticket:', ticket.id);
      
      // Buscar nome da categoria para determinar se é incidente
      let categoryName: string | null = null;
      if (category_id) {
        try {
          const { data: categoryData } = await supabase
            .from('ticket_categories')
            .select('name')
            .eq('id', Number(category_id))
            .single();
          categoryName = categoryData?.name || null;
          console.log('DEBUG: Categoria encontrada:', categoryName);
        } catch (error) {
          console.warn('Erro ao buscar categoria:', error);
        }
      }

      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Usuário';
      console.log('DEBUG: Nome do usuário para notificação:', userName);
      
      // Criar notificação de forma assíncrona usando external_id
      if (user.is_client) {
        // Cliente: usar versão simplificada (criador + responsável)
        createTicketNotificationForClient({
          ticketId: ticket.external_id || ticket.id.toString(),
          categoryName,
          userName,
          userId: user.id,
          responsibleId: responsibleId || null,
        }).catch(error => {
          console.error('Erro ao criar notificação do sistema (cliente):', error);
        });
      } else {
        // Funcional: usar versão completa com lógica de recipients
        createTicketNotification({
          ticketId: ticket.external_id || ticket.id.toString(),
          categoryName,
          userName,
          userId: user.id,
          projectId: contractId,
          moduleId: Number(module_id),
        }).catch(error => {
          console.error('Erro ao criar notificação do sistema (funcional):', error);
        });
      }
    }

    return NextResponse.json(ticket);
  }
  // Fallback: JSON puro (sem anexo)
  const body = await req.json();
  const {
    contractId,
    partnerId,
    title,
    category_id,
    module_id,
    priority_id,
    description,
    type_id,
    ref_ticket_id,
    ref_external_id,
    responsible_id: responsibleId
  } = body;

  console.log('DEBUG API JSON - type_id recebido:', type_id);
  // Validação detalhada dos campos obrigatórios (JSON)
  const missingFieldsJson = [];
  if (!contractId) missingFieldsJson.push('contractId');
  if (!partnerId) missingFieldsJson.push('partnerId');
  if (!title) missingFieldsJson.push('title');
  // category_id é opcional (só obrigatório para type_id = 2 - SmartBuild)
  if (!category_id) missingFieldsJson.push('category_id');
  if (!module_id) missingFieldsJson.push('module_id');
  if (!priority_id) missingFieldsJson.push('priority_id');
  if (!description) missingFieldsJson.push('description');
  if (missingFieldsJson.length > 0) {
    return NextResponse.json({ error: `Campo(s) obrigatório(s) faltando: ${missingFieldsJson.join(', ')}` }, { status: 400 });
  }  const { data, error } = await supabase
    .from("ticket")
    .insert([
      {
        project_id: contractId,
        partner_id: partnerId,
        title,
        category_id: category_id ? Number(category_id) : null,
        module_id: Number(module_id),
        priority_id: Number(priority_id),
        description,
        type_id: type_id ? Number(type_id) : 1, // Usa o type_id enviado ou 1 como padrão
        status_id: 1, // Pendente ou status inicial padrão
        is_closed: false,
        is_private: false,
        created_by: user.id,
        updated_by: user.id, // Incluir updated_by na criação
        ref_ticket_id: ref_ticket_id || null,
        ref_external_id: ref_external_id || null,
        responsible: responsibleId || null,
      },
    ])
    .select('*, external_id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Se o usuário que criou o ticket for functional-adm, vinculá-lo automaticamente como responsável principal
  if (data?.id && user.role === 3) { // role 3 = functional
    console.log('DEBUG JSON: Vinculando usuário functional como recurso principal:', {
      user_id: user.id,
      ticket_id: data.id,
      user_role: user.role,
      is_client: user.is_client
    });
    
    try {
      const { error: resourceError } = await supabase
        .from("ticket_resource")
        .insert({
          user_id: user.id,
          ticket_id: data.id,
          is_main: true,
        });

      if (resourceError) {
        console.error('Erro ao vincular usuário functional como recurso:', resourceError);
        // Não falha a criação do ticket por causa disso, apenas loga o erro
      } else {
        console.log('DEBUG JSON: Usuário functional vinculado com sucesso como recurso principal');
      }
    } catch (err) {
      console.error('Erro ao vincular usuário functional como recurso:', err);
    }
  }

  // Após criar o ticket com sucesso, verificar se deve enviar notificação por email s
  if (data?.id && user.is_client) {
    // Buscar nome da categoria para o email
    let categoryNameForEmail: string | null = null;
    if (category_id) {
      try {
        const { data: categoryData } = await supabase
          .from('ticket_categories')
          .select('name')
          .eq('id', Number(category_id))
          .single();
        categoryNameForEmail = categoryData?.name || null;
      } catch (error) {
        console.warn('Erro ao buscar categoria para email:', error);
      }
    }

    // Disparar notificação para o criador e o responsável selecionado
    const emailNotificationData = {
      ticketId: data.id.toString(),
      ticketExternalId: data.external_id,
      ticketTitle: title,
      ticketDescription: description,
      categoryName: categoryNameForEmail,
      clientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Cliente',
      clientEmail: user.email || '',
      projectId: contractId,
      createdBy: user.id,
      responsibleId: responsibleId || null,
    };

    // Chamar função de notificação de forma assíncrona para não bloquear a resposta
    notifyByEmailForClient(emailNotificationData).catch((error: unknown) => {
      console.error('Erro ao enviar notificação por email (cliente):', error);
    });
  }

  // Criar notificação no sistema para o ticket criado
  if (data?.id) {
    // Buscar nome da categoria para determinar se é incidente
    let categoryName: string | null = null;
    console.log('DEBUG GUI: category_id', category_id);
    if (category_id) {
      try {
        const { data: categoryData } = await supabase
          .from('ticket_categories')
          .select('name')
          .eq('id', Number(category_id))
          .single();
        categoryName = categoryData?.name || null;
      } catch (error) {
        console.warn('Erro ao buscar categoria:', error);
      }
    }

    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Usuário';
    
    // Criar notificação de forma assíncrona usando external_id
    if (user.is_client) {
      // Cliente: usar versão simplificada (criador + responsável)
      createTicketNotificationForClient({
        ticketId: data.external_id || data.id.toString(),
        categoryName,
        userName,
        userId: user.id,
        responsibleId: responsibleId || null,
      }).catch(error => {
        console.error('Erro ao criar notificação do sistema (cliente):', error);
      });
    } else {
      // Funcional: usar versão completa com lógica de recipients
      createTicketNotification({
        ticketId: data.external_id || data.id.toString(),
        categoryName,
        userName,
        userId: user.id,
        projectId: contractId,
        moduleId: Number(module_id),
      }).catch(error => {
        console.error('Erro ao criar notificação do sistema (funcional):', error);
      });
    }
  }

  return NextResponse.json(data);
}
