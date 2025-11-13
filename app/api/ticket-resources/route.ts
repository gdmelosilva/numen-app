import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Função auxiliar para criar notificação quando recurso é adicionado ao ticket
async function createResourceNotification(ticketId: string, userId: string) {
  try {
    console.log('DEBUG: Criando notificação para recurso adicionado:', { ticketId, userId });
    
    const supabase = await createClient();

    // Buscar informações do ticket para determinar categoria e criador
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        id,
        title,
        external_id,
        category_id,
        created_by,
        ticket_categories:category_id (
          name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket para notificação:', ticketError);
      return;
    }

    // Obter nome da categoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryName = (ticket.ticket_categories as any)?.name || 'chamado';

    console.log('DEBUG: Dados do ticket:', { 
      ticketId: ticket.id,
      externalId: ticket.external_id,
      categoryName, 
      createdBy: ticket.created_by 
    });

    // Criar a notificação
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'ALERT',
        severity: 'info',
        title: `Você tem um novo chamado de ${categoryName}`,
        body: `O chamado #${ticket.external_id} foi vinculado a você`,
        action_url: `/main/smartcare/management/${ticket.external_id}`,
        created_by: ticket.created_by, // Quem criou o ticket
      })
      .select('id')
      .single();

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
      return;
    }

    console.log('DEBUG: Notificação criada com ID:', notification?.id);

    // Criar o recipient da notificação (usuário que foi adicionado como recurso)
    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .insert({
        notification_id: notification.id,
        user_id: userId, // Usuário que foi adicionado como recurso
      });

    if (recipientError) {
      console.error('Erro ao criar recipient da notificação:', recipientError);
    } else {
      console.log(`Notificação de recurso criada com sucesso para ticket ${ticketId}, usuário ${userId}`);
    }

  } catch (error) {
    console.error('Erro na função createResourceNotification:', error);
  }
}

// Função auxiliar para criar notificação quando recurso é marcado como responsável principal
async function createResourceNotificationForMain(ticketId: string, userId: string) {
  try {
    const supabase = await createClient();

    // Buscar informações do ticket para determinar categoria e criador
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        id,
        title,
        external_id,
        category_id,
        created_by,
        ticket_categories:category_id (
          name
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket para notificação de responsável principal:', ticketError);
      return;
    }

    // Obter nome da categoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryName = (ticket.ticket_categories as any)?.name || 'chamado';

    console.log('DEBUG: Dados do ticket para responsável principal:', { 
      ticketId: ticket.id,
      externalId: ticket.external_id,
      categoryName, 
      createdBy: ticket.created_by 
    });

    // Criar a notificação
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: 'ALERT',
        severity: 'warning', // Maior severidade para responsável principal
        title: `Você é o responsável principal pelo chamado de ${categoryName}`,
        body: `Você foi definido como responsável principal do chamado #${ticket.external_id}`,
        action_url: `/main/smartcare/management/${ticket.external_id}`,
        created_by: ticket.created_by, // Quem criou o ticket
      })
      .select('id')
      .single();

    if (notificationError) {
      console.error('Erro ao criar notificação de responsável principal:', notificationError);
      return;
    }

    console.log('DEBUG: Notificação de responsável principal criada com ID:', notification?.id);

    // Criar o recipient da notificação (usuário que foi marcado como responsável principal)
    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .insert({
        notification_id: notification.id,
        user_id: userId, // Usuário que foi marcado como responsável principal
      });

    if (recipientError) {
      console.error('Erro ao criar recipient da notificação de responsável principal:', recipientError);
    } else {
      console.log(`Notificação de responsável principal criada com sucesso para ticket ${ticketId}, usuário ${userId}`);
    }

  } catch (error) {
    console.error('Erro na função createResourceNotificationForMain:', error);
  }
}

// GET /api/ticket-resources?ticket_id=...
export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const ticket_id = searchParams.get("ticket_id");
  let query = supabase
  .from("ticket_resource")
  .select("*, notify, user:user_id(id, first_name, last_name, email, is_client, is_active)");
  if (ticket_id) {
    query = query.eq("ticket_id", ticket_id);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

// PATCH /api/ticket-resources - Atualizar notify
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id, notify } = body;

  if (!user_id || !ticket_id || typeof notify !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  console.log('DEBUG: Atualizando notify do recurso:', { user_id, ticket_id, notify });

  const { data, error } = await supabase
    .from("ticket_resource")
    .update({ notify })
    .eq("user_id", user_id)
    .eq("ticket_id", ticket_id)
    .select();

  if (error) {
    console.error('Erro ao atualizar notify:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/ticket-resources
export async function PUT(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id, is_main } = body;

  if (!user_id || !ticket_id || typeof is_main !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  console.log('DEBUG: Atualizando recurso do ticket:', { user_id, ticket_id, is_main });

  const { data, error } = await supabase
    .from("ticket_resource")
    .update({ is_main })
    .eq("user_id", user_id)
    .eq("ticket_id", ticket_id)
    .select();

  if (error) {
    console.error('Erro ao atualizar recurso:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Se o usuário foi marcado como responsável principal, criar notificação
  if (is_main === true) {
    console.log('DEBUG: Usuário marcado como responsável principal, criando notificação...');
    
    // Criar notificação específica para responsável principal
    createResourceNotificationForMain(ticket_id, user_id).catch((error: unknown) => {
      console.error('Erro ao criar notificação para responsável principal:', error);
    });
  }

  return NextResponse.json(data);
}

// POST /api/ticket-resources
export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id } = body;
  
  if (!user_id || !ticket_id) {
    return NextResponse.json({ error: "user_id e ticket_id são obrigatórios" }, { status: 400 });
  }

  console.log('DEBUG: Adicionando recurso ao ticket:', { user_id, ticket_id });

  const { error } = await supabase.from("ticket_resource").insert({ user_id, ticket_id, notify: true });
  
  if (error) {
    console.error('Erro ao inserir recurso:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('DEBUG: Recurso adicionado com sucesso, criando notificação...');

  // Criar notificação para o usuário que foi adicionado como recurso
  createResourceNotification(ticket_id, user_id).catch((error: unknown) => {
    console.error('Erro ao criar notificação para novo recurso:', error);
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/ticket-resources
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { user_id, ticket_id } = body;
  if (!user_id || !ticket_id) {
    return NextResponse.json({ error: "user_id e ticket_id são obrigatórios" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ticket_resource")
    .delete()
    .eq("user_id", user_id)
    .eq("ticket_id", ticket_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}