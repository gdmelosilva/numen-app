import { EmailTemplateData, EmailTemplate } from './index';
import { getLogoUrl } from './utils';

export function ticketCreatedTemplate(data: EmailTemplateData, baseUrl?: string): EmailTemplate {
  const {
    ticketId,
    ticketExternalId,
    ticketTitle,
    ticketDescription,
    projectName,
    partnerName,
    clientName,
    clientEmail,
    categoryName
  } = data;

  const displayId = ticketExternalId || ticketId;
  
  // URL da logo (usar baseUrl customizada se fornecida, senão usar função utilitária)
  const logoUrl = baseUrl ? `${baseUrl}/LOGO%20CLARO%201@2x.png` : getLogoUrl();
  
  return {
    subject: `EasyTime - Novo Chamado: ${ticketTitle}`,
    
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Chamado - EasyTime</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img 
                src="${logoUrl}" 
                alt="EasyTime - Sistema de Gestão de Chamados" 
                style="height: auto; width: auto; max-width: 200px; display: block; margin: 0 auto;"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
              />
              <!-- Fallback text caso a imagem não carregue -->
              <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold; display: none;">
                EasyTime
              </h1>
              <div style="height: 2px; background-color: #e5e7eb; margin: 15px 0;"></div>
            </div>
            
            <!-- Título Principal -->
            <h2 style="color: #2563eb; margin-top: 0; margin-bottom: 20px; font-size: 20px;">
              Novo Chamado de ${partnerName}
            </h2>
            
            <!-- Detalhes do Chamado -->
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px; font-size: 16px;">
                Detalhes do Chamado
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151; width: 120px;">ID do Chamado:</td>
                  <td style="padding: 5px 0; color: #6b7280;">#${displayId}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151;">Título:</td>
                  <td style="padding: 5px 0; color: #6b7280;">${ticketTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151;">Projeto:</td>
                  <td style="padding: 5px 0; color: #6b7280;">${projectName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151;">Parceiro:</td>
                  <td style="padding: 5px 0; color: #6b7280;">${partnerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151;">Criado por:</td>
                  <td style="padding: 5px 0; color: #6b7280;">${clientName}${clientEmail ? ` (${clientEmail})` : ''}</td>
                </tr>
                ${categoryName ? `
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; color: #374151;">Categoria:</td>
                  <td style="padding: 5px 0; color: #6b7280;">${categoryName}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Descrição -->
            <div style="margin: 20px 0;">
              <h4 style="color: #374151; margin-bottom: 10px; font-size: 14px;">
                Descrição do Chamado:
              </h4>
              <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px; line-height: 1.5;">
                ${ticketDescription.replace(/\n/g, '<br>')}
              </div>
            </div>

            <!-- Call to Action (opcional) -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; border: 1px solid #bfdbfe;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;">
                  💡 Acesse o sistema EasyTime para visualizar e gerenciar este chamado
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0; line-height: 1.4;">
                Este é um email automático gerado pelo sistema EasyTime.<br>
                Não responda diretamente a este email.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} EasyTime - Sistema de Gestão de Chamados
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    
    text: `
🎫 NOVO CHAMADO AMS CRIADO

═══════════════════════════════════════

DETALHES DO CHAMADO:
• ID do Chamado: #${displayId}
• Título: ${ticketTitle}
• Projeto: ${projectName}
• Parceiro: ${partnerName}
• Criado por: ${clientName}${clientEmail ? ` (${clientEmail})` : ''}${categoryName ? `\n• Categoria: ${categoryName}` : ''}

DESCRIÇÃO:
${ticketDescription}

═══════════════════════════════════════

💡 Acesse o sistema EasyTime para visualizar e gerenciar este chamado.

---
Este é um email automático gerado pelo sistema EasyTime.
Não responda diretamente a este email.

© ${new Date().getFullYear()} EasyTime - Sistema de Gestão de Chamados
    `.trim()
  };
}
