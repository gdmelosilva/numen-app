import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const clientViewParam = searchParams.get("client_view") === "true";

  if (!projectId) {
    return NextResponse.json({ error: "project_id é obrigatório" }, { status: 400 });
  }

  try {
    // Autenticar e obter dados do usuário
    const { user, error: authError } = await authenticateRequest();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Determinar se deve usar visualização de cliente baseado no perfil do usuário
    // Clientes sempre têm client_view=true, independente do parâmetro enviado
    const userIsClient = user.is_client === true;
    const shouldUseClientView = userIsClient || clientViewParam;

    // Log de segurança para auditoria
    if (userIsClient && !clientViewParam) {
      console.warn('Tentativa de usuário cliente acessar dados não-cliente:', {
        userId: user.id,
        email: user.email,
        projectId,
        clientViewParam
      });
    }

    // Buscar tickets do projeto
    const { data: tickets, error: ticketsError } = await supabase
      .from("ticket")
      .select("id")
      .eq("project_id", projectId);

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ totalHours: 0 });
    }

    const ticketIds = tickets.map(t => t.id);

    // Buscar a somatória das horas das mensagens dos tickets
    let query = supabase
      .from("message")
      .select("hours")
      .in("ticket_id", ticketIds);

    // Para clientes, SEMPRE excluir mensagens privadas (forçar segurança)
    if (shouldUseClientView) {
      query = query.eq("is_private", false);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    // Calcular total de horas
    const totalHours = (messages || []).reduce((sum, message) => {
      const hours = typeof message.hours === 'number' ? message.hours : 
                   typeof message.hours === 'string' ? parseFloat(message.hours) : 0;
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);

    return NextResponse.json({ totalHours });

  } catch (error) {
    console.error("Erro ao buscar horas estimadas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
