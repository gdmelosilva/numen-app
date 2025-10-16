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
  const subject = `EasyTime - Chamado Vinculado: ${ticketTitle}`;
  const link = `${(baseUrl ?? 'https://numenit-ops.com')}/main/smartcare/management/${displayTicketId}`;
  

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
  <title>Chamado Vinculado - EasyTime</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'Manrope', Arial, Helvetica, sans-serif !important; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .header-image, .footer-image { width: 100% !important; height: auto !important; }
      .content-wrapper { width: 100% !important; padding: 20px !important; }
      .info-table { font-size: 14px !important; }
      .info-table td { display: block !important; width: 100% !important; padding: 5px 0 !important; }
      .info-table td:first-child { font-weight: bold !important; padding-bottom: 2px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0px; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; align-items: center; justify-content: center; display: flex;">
  <div style="max-width: 780px; background: linear-gradient(135deg, #ffcd83 0%, #ffffff 15%, #ffffff 50%, #ffffff 85%, #dff8ff 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; align-items: center; padding: 10px 10px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: transparent;">
      <tr>
        <td align="center" style="padding: 0; margin: 0px;">

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container" style="width: 680px; max-width: 680px; background-color: transparent;">
            <tr>
              <td align="center" style="padding: 0; margin: 0px;">
                <img src="https://easytime-dev.numenlean.com/mailing/ATUALIZAÇÃO%201%20EMAIL%20HEAD%20@2x.png"
                     alt="EasyTime - Header"
                     class="header-image"
                     style="width: 680px; max-width: 100%; height: auto; display: block; border: 0;">
              </td>
            </tr>

            <tr>
              <td style="background-color: transparent; position: relative;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td class="content-wrapper" style="padding: 40px 50px; padding-bottom: 20px;">

                      <!-- Título/Seção: Dados da Atribuição -->
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://numenit-ops.com/icons/info.svg" alt="Info Icon" style="width: 18px; height: auto; margin-bottom: 20px; margin-right: 10px;">
                        <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
                          Dados da Atribuição
                        </h2>
                      </div>

                      <div style="background-color: #fff9f3; outline: 3px solid #ffd284; border-radius: 12px; border-left: 3px solid #ffa200; border-right: 0; border-top: 0; border-bottom: 0; margin-bottom: 25px; padding: 25px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);">
                        <!-- ID -->
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">ID do Chamado:</span>
                          <span style="color: #374151; font-weight: bold;">#${displayTicketId}</span>
                        </div>

                        <!-- Título -->
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Título:</span>
                          <span style="color: #374151;">${ticketTitle}</span>
                        </div>

                        <!-- Projeto -->
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Projeto:</span>
                          <span style="color: #374151;">${projectName}</span>
                        </div>

                        <!-- Parceiro -->
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Parceiro:</span>
                          <span style="color: #374151;">${partnerName}</span>
                        </div>

                        <!-- Categoria (condicional) -->
                        ${categoryName ? `
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Categoria:</span>
                          <span style="color: #374151;">${categoryName}</span>
                        </div>` : ''}

                        <!-- Recurso Vinculado -->
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Recurso Vinculado:</span>
                          <span style="color: #374151;">${resourceName} (${resourceEmail})</span>
                        </div>

                        <!-- Vinculado por (condicional) -->
                        ${assignedBy ? `
                        <div style="margin-bottom: 8px;">
                          <span style="font-weight: bold; color: #374151; display: inline-block; width: 160px; vertical-align: top;">Vinculado por:</span>
                          <span style="color: #374151;">${assignedBy}</span>
                        </div>` : ''}
                      </div>

                      <!-- Resumo/Descrição do Chamado -->
                      <div style="margin-bottom: 30px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <img src="https://numenit-ops.com/icons/msg.svg" alt="Message Icon" style="width: 18px; height: auto; margin-bottom: 20px; margin-right: 10px;">
                          <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
                            Resumo do Chamado
                          </h2>
                        </div>

                        <div style="background-color: #f3ffff; outline: 3px solid #84d8ff; border-radius: 12px; border-left: 3px solid #00ccff; border-right: 0; border-top: 0; border-bottom: 0; margin-bottom: 25px; padding: 25px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);">
                          <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 15px;">
                            ${ticketDescription ? ticketDescription.replace(/\n/g, '<br>') : '—'}
                          </p>
                        </div>
                      </div>

                      <!-- CTA -->
                      <div style="margin-bottom: 30px; text-align: center;">
                        <a href="${link}"
                           style="display: flex; align-items: center; justify-content: center; height: 48px; width: 200px; padding: 12px 30px; background-color: #074799; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 6px; margin: 0 auto;">
                          <img src="https://numenit-ops.com/ÍCONE%20AZUL%20E%20LARANJA@2x.png" alt="EasyTime Logo" style="width: auto; height: 24px; margin-right: 8px;">
                          <span style="margin: 0;">Ver Chamado</span>
                        </a>
                      </div>

                      <!-- Aviso -->
                      <div style="background-color: #fff9f3; outline: 3px solid #ffd284; border-radius: 12px; border-left: 3px solid #ffa200; border-right: 0; border-top: 0; border-bottom: 0; margin-bottom: 25px; padding: 18px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.06);">
                        <p style="color: #374151; margin: 0; font-size: 13px;">
                          <strong>Importante:</strong> Você agora é responsável por este chamado. Verifique os detalhes e inicie o atendimento conforme necessário.
                        </p>
                      </div>

                      <!-- Rodapé do conteúdo -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                             style="border-top: 1px solid #e5e7eb; padding-top: 25px;">
                        <tr style="text-align: center; align-items: center;">
                          <td align="center">
                            <p style="color: #6b7280; font-size: 11px; margin: 0; padding: 0px; text-align: center;">
                              Este é um email automático gerado pelo sistema EasyTime.<br>
                              Não responda diretamente a este email.
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>

        </td>
      </tr>

      <!-- Footer com imagem -->
      <tr>
        <td align="center" style="padding: 0;">
          <img src="https://numenit-ops.com/mailing/ATUALIZAÇÃO%202%20EMAIL%20BOTTOM%20-%20Updated.png"
               alt="EasyTime - Footer"
               class="footer-image"
               style="width: 680px; max-width: 100%; height: auto; display: block; border: 0; margin: 0px;">
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `.trim();

  const text = `
CHAMADO VINCULADO - EASYTIME

═══════════════════════════════════════

DADOS DA VINCULAÇÃO:
• ID do Chamado: #${displayTicketId}
• Título: ${ticketTitle}
• Projeto: ${projectName}
• Parceiro: ${partnerName}
${categoryName ? `• Categoria: ${categoryName}\n` : ''}• Recurso Vinculado: ${resourceName} (${resourceEmail})${assignedBy ? `\n• Vinculado por: ${assignedBy}` : ''}

RESUMO DO CHAMADO:
${ticketDescription || '—'}

═══════════════════════════════════════

Acesse o sistema EasyTime para ver mais detalhes do chamado:
${link}

---
Este é um email automático gerado pelo sistema EasyTime.
Não responda diretamente a este email.
  `.trim();

  return { subject, html, text };
}