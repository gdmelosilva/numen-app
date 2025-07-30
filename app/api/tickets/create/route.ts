import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { authenticateRequest } from "@/lib/api-auth";
import { sendOutlookMail } from "@/lib/sendOutlookMail";

// Função auxiliar para enviar notificação por email
async function notifyProjectManagers(ticketData: {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
}) {
  try {
    const supabase = await createClient();

    // Buscar informações do projeto
    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('name, partner_id, partners(name)')
      .eq('id', ticketData.projectId)
      .single();

    if (projectError || !project) {
      console.error('Erro ao buscar projeto:', projectError);
      return;
    }

    // Buscar gerentes do projeto
    const { data: projectResources, error: resourceError } = await supabase
      .from('project_resources')
      .select(`
        user_id,
        user_functional,
        users!inner(
          id,
          email,
          first_name,
          last_name,
          is_client,
          role
        )
      `)
      .eq('project_id', ticketData.projectId)
      .eq('is_suspended', false);

    if (resourceError) {
      console.error('Erro ao buscar recursos do projeto:', resourceError);
      return;
    }

    // Filtrar apenas gerentes que não são clientes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const managers = projectResources?.filter((resource: any) => {
      const userRecord = resource.users;
      return (
        userRecord && 
        !userRecord.is_client && 
        (resource.user_functional === 2 || userRecord.role === 2) // Assumindo que 2 = Manager
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).map((resource: any) => ({
      id: resource.users.id,
      email: resource.users.email,
      first_name: resource.users.first_name,
      last_name: resource.users.last_name,
      full_name: `${resource.users.first_name || ''} ${resource.users.last_name || ''}`.trim()
    })) || [];

    if (!managers || managers.length === 0) {
      console.warn(`Nenhum gerente encontrado para o projeto ${ticketData.projectId}`);
      return;
    }

    // Preparar o conteúdo do email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerName = (project.partners as any)?.name || 'N/A';
    const subject = `🎫 Novo Chamado AMS: ${ticketData.ticketTitle}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            🎫 Novo Chamado AMS Criado
          </h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Detalhes do Chamado</h3>
            <p><strong>ID do Chamado:</strong> #${ticketData.ticketId}</p>
            <p><strong>Título:</strong> ${ticketData.ticketTitle}</p>
            <p><strong>Projeto:</strong> ${project.name}</p>
            <p><strong>Parceiro:</strong> ${partnerName}</p>
            <p><strong>Cliente:</strong> ${ticketData.clientName} ${ticketData.clientEmail ? `(${ticketData.clientEmail})` : ''}</p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #374151; margin-bottom: 10px;">Descrição:</h4>
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
              ${ticketData.ticketDescription.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
              📧 Este é um email automático gerado pelo sistema Numen.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
              🔔 Você está recebendo esta notificação porque é gerente do projeto.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Novo Chamado AMS Criado

ID do Chamado: #${ticketData.ticketId}
Título: ${ticketData.ticketTitle}
Projeto: ${project.name}
Parceiro: ${partnerName}
Cliente: ${ticketData.clientName} ${ticketData.clientEmail ? `(${ticketData.clientEmail})` : ''}

Descrição:
${ticketData.ticketDescription}

---
Este é um email automático gerado pelo sistema Numen.
Você está recebendo esta notificação porque é gerente do projeto.
    `.trim();

    // Interface para o gerente
    interface Manager {
      id: string;
      email: string;
      full_name: string;
    }

    // Enviar email para cada gerente
    const emailPromises = managers.map(async (manager: Manager) => {
      if (!manager.email) {
        console.warn(`Gerente ${manager.full_name} não possui email cadastrado`);
        return { success: false, manager: manager.full_name, error: 'Email não cadastrado' };
      }

      try {
        await sendOutlookMail({
          to: manager.email,
          subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`Email enviado com sucesso para ${manager.full_name} (${manager.email})`);
        return { success: true, manager: manager.full_name, email: manager.email };
      } catch (error) {
        console.error(`Erro ao enviar email para ${manager.full_name}:`, error);
        return { success: false, manager: manager.full_name, error: error instanceof Error ? error.message : 'Erro desconhecido' };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Notificações de email processadas: ${successful.length} enviadas, ${failed.length} falharam`);
    if (failed.length > 0) {
      console.error('Falhas no envio de email:', failed);
    }

  } catch (error) {
    console.error('Erro ao processar notificação de gerentes:', error);
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
    const description = formData.get("description") as string;    const type_id = formData.get("type_id") as string;
    const attachment = formData.get("file") as File | null;
    const ref_ticket_id = formData.get("ref_ticket_id") as string | null;
    const ref_external_id = formData.get("ref_external_id") as string | null;

    console.log('DEBUG API FormData - type_id recebido:', type_id);    // Validação detalhada dos campos obrigatórios (FormData)
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
          ref_ticket_id: ref_ticket_id || null,
          ref_external_id: ref_external_id || null,
        },
      ])
      .select()
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
      // Disparar notificação para os gerentes do projeto
      const notificationData = {
        ticketId: ticket.id,
        ticketTitle: title,
        ticketDescription: description,
        projectId: contractId,
        clientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Cliente',
        clientEmail: user.email || '',
      };

      // Chamar função de notificação de forma assíncrona para não bloquear a resposta
      notifyProjectManagers(notificationData).catch(error => {
        console.error('Erro ao enviar notificação por email:', error);
      });
    }

    return NextResponse.json(ticket);
  }
  // Fallback: JSON puro (sem anexo)
  const body = await req.json();
  const {
    contractId,
    partner_id,
    title,
    category_id,
    module_id,
    priority_id,
    description,
    type_id,
    ref_ticket_id,
    ref_external_id
  } = body;

  console.log('DEBUG API JSON - type_id recebido:', type_id);
  // Validação detalhada dos campos obrigatórios (JSON)
  const missingFieldsJson = [];
  if (!contractId) missingFieldsJson.push('contractId');
  if (!partner_id) missingFieldsJson.push('partner_id');
  if (!title) missingFieldsJson.push('title');
  // category_id é opcional (só obrigatório para type_id = 2 - SmartBuild)
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
        ref_ticket_id: ref_ticket_id || null,
        ref_external_id: ref_external_id || null,
      },
    ])
    .select()
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
          created_at: new Date().toISOString()
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

  // Após criar o ticket com sucesso, verificar se deve enviar notificação por email
  if (data?.id && user.is_client) {
    // Disparar notificação para os gerentes do projeto
    const notificationData = {
      ticketId: data.id,
      ticketTitle: title,
      ticketDescription: description,
      projectId: contractId,
      clientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Cliente',
      clientEmail: user.email || '',
    };

    // Chamar função de notificação de forma assíncrona para não bloquear a resposta
    notifyProjectManagers(notificationData).catch(error => {
      console.error('Erro ao enviar notificação por email:', error);
    });
  }

  return NextResponse.json(data);
}
