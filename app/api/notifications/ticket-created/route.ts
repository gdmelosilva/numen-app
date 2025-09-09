import { NextRequest, NextResponse } from 'next/server';
import { sendOutlookMail } from '@/lib/send-mail';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/api-auth';

interface NotificationData {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: NotificationData = await req.json();
    const { ticketId, ticketTitle, ticketDescription, projectId, clientName, clientEmail } = body;

    if (!ticketId || !ticketTitle || !projectId || !clientName) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando: ticketId, ticketTitle, projectId, clientName' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar informações do projeto
    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('name, partner_id, partners(name)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Erro ao buscar projeto:', projectError);
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    // Buscar gerentes do projeto
    const managersResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/projects/manager?project_id=${projectId}`,
      {
        method: 'GET',
        headers: {
          'Cookie': req.headers.get('cookie') || '',
        },
      }
    );

    if (!managersResponse.ok) {
      console.error('Erro ao buscar gerentes do projeto');
      return NextResponse.json({ error: 'Erro ao buscar gerentes do projeto' }, { status: 500 });
    }

    const { managers } = await managersResponse.json();

    if (!managers || managers.length === 0) {
      console.warn(`Nenhum gerente encontrado para o projeto ${projectId}`);
      return NextResponse.json({ 
        message: 'Nenhum gerente encontrado para notificar',
        success: true 
      });
    }

    // Preparar o conteúdo do email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerName = (project.partners as any)?.name || 'N/A';
    const subject = `🎫 Novo Chamado AMS: ${ticketTitle}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
            🎫 Novo Chamado AMS Criado
          </h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Detalhes do Chamado</h3>
            <p><strong>ID do Chamado:</strong> #${ticketId}</p>
            <p><strong>Título:</strong> ${ticketTitle}</p>
            <p><strong>Projeto:</strong> ${project.name}</p>
            <p><strong>Parceiro:</strong> ${partnerName}</p>
            <p><strong>Cliente:</strong> ${clientName} ${clientEmail ? `(${clientEmail})` : ''}</p>
          </div>

          <div style="margin: 20px 0;">
            <h4 style="color: #374151; margin-bottom: 10px;">Descrição:</h4>
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
              ${ticketDescription.replace(/\n/g, '<br>')}
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

ID do Chamado: #${ticketId}
Título: ${ticketTitle}
Projeto: ${project.name}
Parceiro: ${partnerName}
Cliente: ${clientName} ${clientEmail ? `(${clientEmail})` : ''}

Descrição:
${ticketDescription}

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

    return NextResponse.json({
      success: true,
      message: `Notificações processadas: ${successful.length} enviadas, ${failed.length} falharam`,
      results: {
        successful,
        failed,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Erro ao processar notificação de gerentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
