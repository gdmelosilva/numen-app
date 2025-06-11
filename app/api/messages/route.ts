import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Message } from "@/types/messages";
import { authenticateRequest } from "@/lib/api-auth";

// GET: Lista todas as mensagens de um ticket (por ticket_id)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticket_id = searchParams.get("ticket_id");
  if (!ticket_id) {
    return NextResponse.json({ error: "ticket_id é obrigatório" }, { status: 400 });  }
  const supabase = await createClient();
  
  // Busca mensagens
  const { data: messagesData, error: messagesError } = await supabase
    .from("message")
    .select(`id, ext_id, body, hours, is_private, created_at, created_by, ticket_id, status_id, user:created_by(id, first_name, last_name, is_client), is_system, ref_msg_id`)
    .eq("ticket_id", ticket_id)
    .order("created_at", { ascending: true });
    
  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }
  // Busca anexos das mensagens
  const messageIds = (messagesData || []).map(msg => msg.id);
  let attachmentsData: { id: string; name: string; path: string; message_id: string }[] = [];
  
  if (messageIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from("attachment")
      .select("id, name, path, message_id")
      .in("message_id", messageIds);
      
    if (!attachmentsError) {
      attachmentsData = attachments || [];
    }
  }

  // Corrige o formato do campo user para ser um objeto (não array) e une o nome e adiciona anexos
  const messages = (messagesData || []).map((msg: Record<string, unknown>) => {
    let user = { name: '', is_client: false };
    if (Array.isArray(msg.user) && msg.user[0]) {
      const u = msg.user[0] as { first_name?: string; last_name?: string; id?: string; is_client?: boolean };
      user = { ...u, name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(), is_client: !!u.is_client };
    } else if (msg.user && typeof msg.user === 'object') {
      const u = msg.user as { first_name?: string; last_name?: string; id?: string; is_client?: boolean };
      user = { ...u, name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(), is_client: !!u.is_client };
    }
    
    // Adiciona anexos da mensagem
    const messageAttachments = attachmentsData.filter(att => att.message_id === msg.id);
    
    // Retorna todos os campos originais + user corrigido + anexos
    return {
      ...msg,
      user,
      attachments: messageAttachments,
      ref_msg_id: msg.ref_msg_id // garante que o campo é retornado
    } as unknown as Message;
  });
  return NextResponse.json(messages as Message[]);
}

// POST: Cria uma nova mensagem
export async function POST(req: NextRequest) {
  // Autentica e pega o usuário logado
  const { user, error: authError } = await authenticateRequest();
  if (authError || !user) return authError;
  const body = await req.json();
  const { ticket_id, body: msgBody, hours, is_private, status_id } = body;
  // Corrige: não aceitar created_by vindo do client (pode vir como objeto)
  if (!ticket_id || !msgBody) {
    return NextResponse.json({ error: "ticket_id e body são obrigatórios" }, { status: 400 });
  }
  const supabase = await createClient();
  // LOG: dados recebidos e enviados para insert
  console.log("[POST /api/messages] user:", user);
  console.log("[POST /api/messages] body:", body);
  const { data, error } = await supabase
    .from("message")
    .insert([
      {
        ticket_id,
        body: msgBody,
        hours: hours ?? null,
        is_private: !!is_private,
        // Só envia status_id se for number
        ...(typeof status_id === 'number' ? { status_id } : {}),
        created_by: user.id, // sempre string do id do usuário autenticado
      },
    ])
    .select()
    .single();
  if (error) {
    console.error("[POST /api/messages] Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Message);
}
