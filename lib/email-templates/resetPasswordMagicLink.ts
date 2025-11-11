export function resetPasswordMagicLinkTemplate({
  userName,
  actionLink,
}: {
  userName?: string;
  actionLink: string;
}) {
  const subject = "Redefinição de senha - Numen";
  const greeting = userName ? `Olá, ${userName}!` : "Olá!";
  const html = `
    <table style="width:100%;font-family:Arial,sans-serif;background:#f9f9f9;padding:32px 0;">
      <tr>
        <td align="center">
          <table style="max-width:480px;width:100%;background:#fff;border-radius:8px;box-shadow:0 2px 8px #0001;padding:32px;">
            <tr>
              <td>
                <h2 style="color:#0057b8;margin-bottom:16px;">${greeting}</h2>
                <p style="font-size:16px;color:#222;margin-bottom:16px;">
                  Recebemos uma solicitação para redefinir sua senha.
                </p>
                <p style="font-size:16px;color:#222;margin-bottom:24px;">
                  Clique no botão abaixo para acessar a página de redefinição de senha. Você já estará autenticado e poderá criar uma nova senha imediatamente:
                </p>
                <p style="text-align:center;margin:32px 0;">
                  <a href="${actionLink}" style="background:#0057b8;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                    Redefinir senha
                  </a>
                </p>
                <p style="font-size:14px;color:#555;margin-top:32px;">
                  Se você não solicitou esta alteração, ignore este email.
                </p>
                <p style="font-size:14px;color:#555;margin-top:16px;">
                  Atenciosamente,<br/>Equipe Numen
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  const text = `${greeting}\n\nRecebemos uma solicitação para redefinir sua senha.\nAcesse o link abaixo para criar uma nova senha:\n${actionLink}\n\nSe você não solicitou esta alteração, ignore este email.\n\nEquipe Numen`;

  return { subject, html, text };
}