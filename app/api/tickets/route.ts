import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmailTemplate, TicketUpdatedTemplateData } from "@/lib/email-templates";
import { sendOutlookMail } from "@/lib/send-mail";

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

// Helper para atualização de tickets - CLIENTES: apenas criador e responsável
async function getRecipientsForClientTicketUpdate({
  createdBy,
  responsibleId,
}: {
  createdBy: string;
  responsibleId: string | null;
}): Promise<string[]> {
  const recipients = new Set<string>();

  console.log('DEBUG: Buscando recipients para atualização (cliente):', { createdBy, responsibleId });

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

  const recipientIds = Array.from(recipients);
  console.log(`📊 Total de recipients únicos encontrados: ${recipientIds.length}`);
  return recipientIds;
}

// Helper para atualização de tickets - FUNCIONAIS: lógica original
async function getRecipientsForFunctionalTicketUpdate({
  ticketId,
  projectId,
}: {
  ticketId: string;
  projectId: string;
}): Promise<string[]> {
  const supabase = await createClient();
  const recipients = new Set<string>();

  console.log('DEBUG: Buscando recipients para atualização (funcional):', { ticketId, projectId });

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
async function notifyTicketStatusUpdate({
  ticketId,
  ticketExternalId,
  ticketTitle,
  projectId,
  createdBy,
  responsibleId,
  isCreatorClient,
  updatedByUserId,
  newStatus,
  previousStatus,
  updateDescription,
}: {
  ticketId: string;
  ticketExternalId?: string;
  ticketTitle: string;
  projectId: string;
  createdBy: string;
  responsibleId: string | null;
  isCreatorClient: boolean;
  updatedByUserId: string;
  newStatus: string;
  previousStatus: string;
  updateDescription: string;
}) {
  try {
    console.log('DEBUG: Iniciando envio de emails para atualização do ticket:', ticketId);
    
    const supabase = await createClient();

    // Buscar recipients baseado no tipo de criador
    let recipientUserIds: string[];
    if (isCreatorClient) {
      console.log('DEBUG: Usando lógica de cliente para recipients');
      recipientUserIds = await getRecipientsForClientTicketUpdate({
        createdBy,
        responsibleId,
      });
    } else {
      console.log('DEBUG: Usando lógica de funcional para recipients');
      recipientUserIds = await getRecipientsForFunctionalTicketUpdate({
        ticketId,
        projectId,
      });
    }

    if (recipientUserIds.length === 0) {
      console.warn(`Nenhum recipient encontrado para envio de email do ticket ${ticketId}`);
      return;
    }

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

export async function PUT(req: NextRequest) {
  try {
    const { ticket_id, status_id } = await req.json();
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o ticket atual para verificar se o status mudou e obter dados necessários
    const { data: currentTicket, error: fetchError } = await supabase
      .from("ticket")
      .select(`
        id,
        external_id,
        title,
        project_id,
        module_id,
        status_id,
        created_by,
        responsible,
        status:fk_status(name),
        category:fk_category(name)
      `)
      .eq("id", ticket_id)
      .single();

    if (fetchError || !currentTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o status realmente mudou
    const statusChanged = currentTicket.status_id !== status_id;
    let previousStatusName = '';
    let newStatusName = '';

    if (statusChanged) {
      // Buscar nome do status anterior
      const currentStatus = currentTicket.status as { name: string } | { name: string }[] | null;
      previousStatusName = Array.isArray(currentStatus) ? currentStatus[0]?.name : currentStatus?.name || '';

      // Buscar nome do novo status
      const { data: newStatusData } = await supabase
        .from('ticket_status')
        .select('name')
        .eq('id', status_id)
        .single();
      
      newStatusName = newStatusData?.name || '';
    }

    // Atualizar o ticket
    const { data, error } = await supabase
      .from("ticket")
      .update({ 
        status_id,
        updated_by: user.id // Incluir updated_by na atualização
      })
      .eq("id", ticket_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Se o status mudou, enviar email de notificação
    if (statusChanged && previousStatusName && newStatusName) {
      // const categoryName = currentTicket.category as { name: string } | { name: string }[] | null;
      // const categoryStr = Array.isArray(categoryName) ? categoryName[0]?.name : categoryName?.name || null;

      // Buscar se o criador é cliente
      const { data: creatorData } = await supabase
        .from('user')
        .select('is_client')
        .eq('id', currentTicket.created_by)
        .single();

      const isCreatorClient = creatorData?.is_client || false;

      // Buscar a última mensagem não privada do ticket para usar como updateDescription
      const lastMessageBody = await getLastPublicMessage(currentTicket.id);
      const updateDescription = lastMessageBody || `Status alterado de "${previousStatusName}" para "${newStatusName}"`;

      // Disparar notificação por email de forma assíncrona
      notifyTicketStatusUpdate({
        ticketId: currentTicket.id,
        ticketExternalId: currentTicket.external_id,
        ticketTitle: currentTicket.title,
        projectId: currentTicket.project_id,
        createdBy: currentTicket.created_by,
        responsibleId: currentTicket.responsible || null,
        isCreatorClient,
        updatedByUserId: user.id,
        newStatus: newStatusName,
        previousStatus: previousStatusName,
        updateDescription,
      }).catch(error => {
        console.error('Erro ao enviar email de atualização do ticket:', error);
      });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Erro ao atualizar status do ticket.", details: error } },
      { status: 500 }
    );
  }
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || searchParams.get('partner_id');

    if (!partnerId) {
      return NextResponse.json({ success: false, error: 'partnerId é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();

    // (Opcional) exigir autenticação, mantendo padrão do PUT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar projetos do parceiro
    const { data: projects, error: projectErr } = await supabase
      .from('project')
      .select('id')
      .eq('partnerId', partnerId);

    if (projectErr) {
      return NextResponse.json({ success: false, error: projectErr.message }, { status: 500 });
    }

    const projectIds = (projects ?? []).map(p => p.id);
    if (projectIds.length === 0) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    // Tickets com status == 1 nesses projetos
    const { data: tickets, error } = await supabase
      .from('ticket')
      .select(`
        id,
        external_id,
        title,
        description,
        project_id,
        status_id,
        priority_id,
        module_id,
        category_id,
  type_id,
        created_at,
        planned_end_date,
        actual_end_date,
        project:project_id (
          id,
          projectDesc:projectName,
          partnerId,
          partner:partnerId (
            partner_desc
          )
        ),
        status:fk_status ( id, name ),
        category:fk_category ( id, name ),
        module:fk_module ( id, name ),
        priority:fk_priority ( id, name ),
  type:fk_type ( id, name ),
        created_by_user:created_by ( id, first_name, last_name, email )
      `)
      .in('project_id', projectIds)
      .eq('status_id', 1)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tickets do parceiro com status 1', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}