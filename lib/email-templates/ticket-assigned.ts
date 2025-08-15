import { emailStyles, textTemplateStyles } from './styles';
import { getLogoUrl } from './utils';

export interface TicketAssignedTemplateData {
  ticketId: string;
  ticketExternalId?: string;
  ticketTitle: string;
  ticketDescription: string;
  projectName: string;
  partnerName: string;
  resourceName: string;
  resourceEmail: string;
  categoryName?: string;
  assignedBy?: string;
}

export interface TicketAssignedTemplate {
  subject: string;
  html: string;
  text: string;
}

export function ticketAssignedTemplate(
  data: TicketAssignedTemplateData,
  baseUrl?: string
): TicketAssignedTemplate {
  const {
    ticketId,
    ticketExternalId,
    ticketTitle,
    ticketDescription,
    projectName,
    partnerName,
    resourceName,
    resourceEmail,
    categoryName,
    assignedBy
  } = data;

  const displayTicketId = ticketExternalId || ticketId;
  const logoUrl = getLogoUrl();
  const currentYear = new Date().getFullYear();

  const subject = `Chamado ${displayTicketId} vinculado - ${ticketTitle}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        ${Object.entries(emailStyles).map(([key, value]) => {
          if (typeof value === 'string') {
            return `.${key} { ${value} }`;
          }
          return '';
        }).filter(Boolean).join('\n        ')}
        
        body { margin: 0; padding: 0; background-color: #f9f9f9; }
        .container { ${emailStyles.container} }
        .card { ${emailStyles.card} }
        .header { ${emailStyles.headerLogo} }
        .logo { max-width: 150px; height: auto; }
        .title { ${emailStyles.title} }
        .content { margin: 20px 0; }
        .greeting { margin-bottom: 20px; }
        .main-message { ${emailStyles.section} }
        .ticket-details { ${emailStyles.section} }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
        .cta-section { ${emailStyles.ctaBox} margin: 20px 0; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .additional-info { ${emailStyles.section} }
        .footer { ${emailStyles.footer} }
        .footer p { ${emailStyles.footerText} }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <!-- Header -->
          <div class="header">
            <img src="${logoUrl}" alt="EasyTime" class="logo" />
            <h1 class="title">Chamado Vinculado</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="greeting">
              <p>Olá <strong>${resourceName}</strong>,</p>
            </div>

            <div class="main-message">
              <p>O chamado <strong>${displayTicketId}</strong> foi vinculado a você como recurso.</p>
            </div>

            <!-- Ticket Details -->
            <div class="ticket-details">
              <h2>Detalhes do Chamado</h2>
              
              <div class="detail-row">
                <span class="label">ID do Chamado:</span>
                <span class="value">${displayTicketId}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Título:</span>
                <span class="value">${ticketTitle}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Descrição:</span>
                <span class="value">${ticketDescription}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Projeto:</span>
                <span class="value">${projectName}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Parceiro:</span>
                <span class="value">${partnerName}</span>
              </div>
              
              ${categoryName ? `
              <div class="detail-row">
                <span class="label">Categoria:</span>
                <span class="value">${categoryName}</span>
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="label">Recurso Vinculado:</span>
                <span class="value">${resourceName} (${resourceEmail})</span>
              </div>
              
              ${assignedBy ? `
              <div class="detail-row">
                <span class="label">Vinculado por:</span>
                <span class="value">${assignedBy}</span>
              </div>
              ` : ''}
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
              <p>Acesse o sistema para visualizar o chamado e iniciar o atendimento:</p>
              <div style="text-align: center; margin-top: 15px;">
                <a href="${baseUrl || '#'}/main/smartcare/management/${displayTicketId}" class="button">
                  Ver Chamado
                </a>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="additional-info">
              <p><strong>Importante:</strong> Você agora é responsável por este chamado. Verifique os detalhes e inicie o atendimento conforme necessário.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Este é um e-mail automático do sistema EasyTime.</p>
            <p>© ${currentYear} EasyTime. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${textTemplateStyles.divider}
${textTemplateStyles.icons.ticket} CHAMADO VINCULADO
${textTemplateStyles.divider}

Olá ${resourceName},

O chamado ${displayTicketId} foi vinculado a você como recurso.

${textTemplateStyles.icons.details} DETALHES DO CHAMADO:
${textTemplateStyles.divider}
ID do Chamado: ${displayTicketId}
Título: ${ticketTitle}
Descrição: ${ticketDescription}
Projeto: ${projectName}
Parceiro: ${partnerName}
${categoryName ? `Categoria: ${categoryName}\n` : ''}Recurso Vinculado: ${resourceName} (${resourceEmail})
${assignedBy ? `Vinculado por: ${assignedBy}\n` : ''}
${textTemplateStyles.divider}

${textTemplateStyles.icons.info} AÇÃO NECESSÁRIA:
Acesse o sistema para visualizar o chamado e iniciar o atendimento:
${baseUrl || '[Sistema EasyTime]'}/main/smartcare/management/${displayTicketId}

IMPORTANTE: Você agora é responsável por este chamado. Verifique os detalhes e inicie o atendimento conforme necessário.

${textTemplateStyles.divider}
Este é um e-mail automático do sistema EasyTime.
© ${currentYear} EasyTime. Todos os direitos reservados.
  `.trim();

  return {
    subject,
    html,
    text
  };
}
