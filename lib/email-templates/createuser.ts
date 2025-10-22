export interface CreateUserTemplateData {
    userName: string;
    userEmail: string;
    projectName?: string;
    temporaryPassword?: string;
    loginUrl?: string;
}

export interface CreateUserTemplate {
    subject: string;
    html: string;
    text: string;
}

export function createUserTemplate(
    data: CreateUserTemplateData,
    baseUrl?: string
): CreateUserTemplate {
    const {
        userName,
        userEmail,
        temporaryPassword,
        loginUrl
    } = data;

    const subject = `EasyTime - Novo Usuário Criado: ${userName}`;
    const link = loginUrl || `${baseUrl ?? 'https://easytime.numenlean.com'}`;

    const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
            <meta charset="UTF-8">
            <title>Novo Usuário Criado - EasyTime</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- Preheader (texto de pré-visualização) -->
            <meta name="x-apple-disable-message-reformatting">
            <!-- Evite fontes externas; use fallbacks do sistema -->
            </head>
            <body style="margin:0; padding:0; background-color:#f5f5f5; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
            <!-- Wrapper -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;">
                <tr>
                <td align="center" style="padding:20px 10px;">
                    <!-- Container -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
                    
                    <!-- Header Image -->
                    <tr>
                        <td align="center" style="padding:0;">
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding:24px 24px 8px 24px; font-family:Arial, Helvetica, sans-serif; color:#374151;">
                        <h2 style="margin:0 0 12px 0; font-size:20px; line-height:1.3; font-weight:bold;">Dados do Usuário</h2>
                        </td>
                    </tr>

                    <!-- Bloco de dados (verde claro) -->
                    <tr>
                        <td style="padding:0 24px 16px 24px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                            <tr>
                            <td style="background-color:#e8f5e8; border-left:3px solid #00cc00; border-radius:8px; padding:16px; font-family:Arial, Helvetica, sans-serif;">
                                
                                <!-- Linha: Nome -->
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="140" valign="top" style="font-weight:bold; color:#374151; padding:4px 0; font-size:14px;">Nome:</td>
                                    <td valign="top" style="color:#374151; padding:4px 0; font-size:14px; font-weight:bold;">${userName}</td>
                                </tr>
                                <!-- Linha: Email -->
                                <tr>
                                    <td width="140" valign="top" style="font-weight:bold; color:#374151; padding:4px 0; font-size:14px;">Email:</td>
                                    <td valign="top" style="color:#374151; padding:4px 0; font-size:14px;">${userEmail}</td>
                                </tr>
                                <!-- Linha: Senha Temporária (renderize condicionalmente no seu back) -->
                                <!-- IF temporaryPassword -->
                                <tr>
                                    <td width="140" valign="top" style="font-weight:bold; color:#374151; padding:4px 0; font-size:14px;">Senha Temporária:</td>
                                    <td valign="top" style="color:#374151; padding:4px 0; font-size:14px; font-weight:bold;">${temporaryPassword}</td>
                                </tr>
                                <!-- ENDIF -->
                                </table>

                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>

                    <!-- Instruções de acesso -->
                    <tr>
                        <td style="padding:8px 24px 0 24px; font-family:Arial, Helvetica, sans-serif; color:#374151;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                            <td valign="middle" width="24" style="padding:0 8px 0 0;">
                                <img src="https://easytime.numenlean.com/icons/info.svg" alt="" width="18" style="display:block; border:0;">
                            </td>
                            <td valign="middle">
                                <h2 style="margin:0; font-size:18px; line-height:1.3; font-weight:bold; color:#374151;">Instruções de Acesso</h2>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:12px 24px 16px 24px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                            <td style="background-color:#f3ffff; border-left:3px solid #00ccff; border-radius:8px; padding:16px; font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:14px; line-height:1.6;">
                                Seu usuário foi criado com sucesso no sistema EasyTime. Use as credenciais acima para o primeiro acesso. Após o login, acesse seu perfil para alterar a senha do usuário.
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>

                    <!-- Botão (bulletproof + VML para Outlook) -->
                    <tr>
                        <td align="center" style="padding:8px 24px 24px 24px;">
                        
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${link}" arcsize="8%" stroke="f" fillcolor="#074799" style="height:48px;v-text-anchor:middle;width:260px;">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:bold;">Acessar EasyTime</center>
                        </v:roundrect>
                        <![endif]-->

                        <!--[if !mso]><!-- -->
                        <a href="${link}" target="_blank"
                            style="background-color:#074799; color:#ffffff; text-decoration:none; display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; line-height:48px; height:48px; width:260px; text-align:center; border-radius:6px;">
                            Acessar EasyTime
                        </a>
                        <!--<![endif]-->

                        </td>
                    </tr>

                    <!-- Divider + rodapé de texto -->
                    <tr>
                        <td style="padding:0 24px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                            <td style="border-top:1px solid #e5e7eb; font-size:0; line-height:0;">&nbsp;</td>
                            </tr>
                        </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:16px 24px 8px 24px; font-family:Arial, Helvetica, sans-serif;">
                        <p style="margin:0; color:#6b7280; font-size:11px; line-height:1.5; text-align:center;">
                            Este é um e-mail automático gerado pelo sistema EasyTime.<br>
                            Não responda diretamente a este e-mail.
                        </p>
                        </td>
                    </tr>

                    <!-- Footer Image -->
                    <tr>
                        <td align="center" style="padding:0;">
                        </td>
                    </tr>

                    </table>
                    <!-- /Container -->
                </td>
                </tr>
            </table>
            <!-- /Wrapper -->
            </body>
            </html>
    `.trim();

    const text = `
NOVO USUÁRIO CRIADO - EASYTIME

═══════════════════════════════════════

DADOS DO USUÁRIO:
• Nome: ${userName}
• Email: ${userEmail}${temporaryPassword ? `\n• Senha Temporária: ${temporaryPassword}` : ''}

INSTRUÇÕES DE ACESSO:
Seu usuário foi criado com sucesso no sistema EasyTime. Use as credenciais fornecidas acima para realizar o primeiro acesso.${temporaryPassword ? ' Após o primeiro login, será solicitado que você altere a senha temporária.' : ''}

═══════════════════════════════════════

Acesse o sistema EasyTime:
${link}

---
Este é um email automático gerado pelo sistema EasyTime.
Não responda diretamente a este email.
    `.trim();

    return { subject, html, text };
}