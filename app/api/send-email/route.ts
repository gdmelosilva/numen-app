import { NextRequest, NextResponse } from "next/server";
import { sendOutlookMail } from "@/lib/sendOutlookMail";

export async function POST(req: NextRequest) {
  try {
    const { email, ticket_id, name } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "E-mail não informado." }, { status: 400 });
    }
    // Monta o conteúdo do e-mail
    const subject = `Ticket ${ticket_id} encaminhado para você`;
    const text = `Olá ${name || "usuário"},\n\nO ticket ${ticket_id} foi encaminhado para você.\n\nAcesse o sistema para mais detalhes.`;
    // Envia o e-mail real
    await sendOutlookMail({
      to: email,
      subject,
      text,
    });
    return NextResponse.json({ success: true, email, ticket_id });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao enviar e-mail.", details: error }, { status: 500 });
  }
}
