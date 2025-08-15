import { EmailTemplateData, EmailTemplate } from './index';

// Template para quando um chamado é atualizado
export interface TicketUpdatedTemplateData extends Omit<EmailTemplateData, 'categoryName'> {
  updatedBy: string;
  updateDescription: string;
  newStatus?: string;
  previousStatus?: string;
}

export function ticketUpdatedTemplate(data: TicketUpdatedTemplateData): EmailTemplate {
  const {
    ticketId,
    ticketExternalId,
    ticketTitle,
    projectName,
    partnerName,
    updatedBy,
    updateDescription,
    newStatus,
    previousStatus
  } = data;

  const displayId = ticketExternalId || ticketId;
  
  return {
    subject: `EasyTime - Chamado Atualizado: ${ticketTitle}`,
    
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chamado Atualizado - EasyTime</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">EasyTime</h1>
              <div style="height: 2px; background-color: #e5e7eb; margin: 15px 0;"></div>
            </div>
            
            <h2 style="color: #f59e0b; margin-top: 0; margin-bottom: 20px; font-size: 20px;">
              🔄 Chamado Atualizado
            </h2>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 16px;">
                📋 Informações da Atualização
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #92400e; width: 120px;">ID do Chamado:</td>
                  <td style="padding: 5px 0; color: #451a03;">#${displayId}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Título:</td>
                  <td style="padding: 5px 0; color: #451a03;">${ticketTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Projeto:</td>
                  <td style="padding: 5px 0; color: #451a03;">${projectName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Atualizado por:</td>
                  <td style="padding: 5px 0; color: #451a03;">${updatedBy}</td>
                </tr>
                ${newStatus && previousStatus ? `
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Status:</td>
                  <td style="padding: 5px 0; color: #451a03;">${previousStatus} → ${newStatus}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="margin: 20px 0;">
              <h4 style="color: #374151; margin-bottom: 10px; font-size: 14px;">
                📝 Descrição da Atualização:
              </h4>
              <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; line-height: 1.5;">
                ${updateDescription.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0; line-height: 1.4;">
                📧 Este é um email automático gerado pelo sistema EasyTime.<br>
                Não responda diretamente a este email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    
    text: `
🔄 CHAMADO ATUALIZADO

═══════════════════════════════════════

📋 INFORMAÇÕES DA ATUALIZAÇÃO:
• ID do Chamado: #${displayId}
• Título: ${ticketTitle}
• Projeto: ${projectName}
• Atualizado por: ${updatedBy}${newStatus && previousStatus ? `\n• Status: ${previousStatus} → ${newStatus}` : ''}

📝 DESCRIÇÃO DA ATUALIZAÇÃO:
${updateDescription}

═══════════════════════════════════════

💡 Acesse o sistema EasyTime para mais detalhes.

---
📧 Este é um email automático gerado pelo sistema EasyTime.
    `.trim()
  };
}
