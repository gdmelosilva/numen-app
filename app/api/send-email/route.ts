import { NextRequest, NextResponse } from "next/server";
import { sendOutlookMail } from "@/lib/send-mail";
import { generateEmailTemplate, type TicketAssignedTemplateData } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { 
      email, 
      ticket_id,
      ticket_external_id,
      ticket_title,
      ticket_description,
      project_name,
      partner_name,
      name,
      assigned_by
    } = await req.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: "E-mail não informado." }, { status: 400 });
    }
    
    // Se temos dados completos do ticket, usar o template HTML moderno
    if (ticket_title && ticket_description && project_name && partner_name) {
      const templateData: TicketAssignedTemplateData = {
        ticketId: ticket_id,
        ticketExternalId: ticket_external_id,
        ticketTitle: ticket_title,
        ticketDescription: ticket_description,
        projectName: project_name,
        partnerName: partner_name,
        resourceName: name || "usuário",
        resourceEmail: email,
        assignedBy: assigned_by
      };

      const emailTemplate = generateEmailTemplate('ticket-assigned', templateData);
      
      await sendOutlookMail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } else {
      // Fallback para o formato simples (manter compatibilidade)
      const displayTicketId = ticket_external_id || ticket_id;
      const subject = `Ticket ${displayTicketId} encaminhado para você`;
      const text = `Olá ${name || "usuário"},\n\nO ticket ${displayTicketId} foi encaminhado para você.\n\nAcesse o sistema para mais detalhes.`;
      
      await sendOutlookMail({
        to: email,
        subject,
        text,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      email, 
      ticket_id: ticket_external_id || ticket_id 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erro ao enviar e-mail.", 
      details: error 
    }, { status: 500 });
  }
}
