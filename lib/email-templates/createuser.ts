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
    const link = loginUrl || `${baseUrl ?? 'https://numenit-ops.com'}/login`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
    <title>Novo Usuário Criado - EasyTime</title>
    <style>
        body { font-family: 'Manrope', Arial, Helvetica, sans-serif !important; background-color: #f5f5f5; }
        .container { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.08); padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .info { background: #f3ffff; border-left: 3px solid #00ccff; border-radius: 8px; padding: 18px; margin-bottom: 24px; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { display: inline-block; background: #074799; color: #fff; padding: 12px 32px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 16px; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; margin-top: 32px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://easytime-dev.numenlean.com/mailing/ATUALIZAÇÃO%201%20EMAIL%20HEAD%20@2x.png" alt="EasyTime" style="max-width: 220px; height: auto;">
            <h2 style="color: #374151; font-size: 22px; margin: 18px 0 0 0;">Novo Usuário Criado</h2>
        </div>
        <div class="info">
            <p><strong>Nome:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            ${temporaryPassword ? `<p><strong>Senha Temporária:</strong> ${temporaryPassword}</p>` : ''}
        </div>
        <div class="cta">
            <a href="${link}">Acessar EasyTime</a>
        </div>
        <div class="footer">
            Este é um email automático gerado pelo sistema EasyTime.<br>
            Não responda diretamente a este email.
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
NOVO USUÁRIO CRIADO - EASYTIME

Nome: ${userName}
Email: ${userEmail}
${temporaryPassword ? `Senha Temporária: ${temporaryPassword}\n` : ''}

Acesse o sistema EasyTime:
${link}

---
Este é um email automático gerado pelo sistema EasyTime.
Não responda diretamente a este email.
    `.trim();

    return { subject, html, text };
}