import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

// PUT: Atualiza uma mensagem específica (tornar privada)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: messageId } = await params;
  
  if (!messageId) {
    return NextResponse.json({ error: "ID da mensagem é obrigatório" }, { status: 400 });
  }

  // Verificar se o messageId é um UUID válido ou número
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId);
  const isNumber = /^\d+$/.test(messageId);
  
  if (!isUUID && !isNumber) {
    return NextResponse.json({ error: "ID da mensagem deve ser um UUID ou número válido" }, { status: 400 });
  }

  // Autentica o usuário
  const { user, error: authError } = await authenticateRequest();
  if (authError) {
    return authError;
  }
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apenas usuários administrativos (não-clientes) podem tornar mensagens privadas
  if (user.is_client) {
    return NextResponse.json({ error: "Apenas usuários administrativos podem tornar mensagens privadas" }, { status: 403 });
  }

  const body = await req.json();
  const { is_private } = body;

  if (typeof is_private !== 'boolean') {
    return NextResponse.json({ error: "is_private deve ser um valor booleano" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verifica se a mensagem existe e se o usuário tem permissão para editá-la
  const { data: messageData, error: messageError } = await supabase
    .from("message")
    .select("id, created_by, is_private")
    .eq("id", messageId);

  if (messageError) {
    return NextResponse.json({ error: "Erro ao buscar mensagem: " + messageError.message }, { status: 500 });
  }

  if (!messageData || messageData.length === 0) {
    return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
  }

  if (messageData.length > 1) {
    return NextResponse.json({ error: "Múltiplas mensagens encontradas para este ID" }, { status: 500 });
  }

  const message = messageData[0];

  // Verifica se o usuário é o criador da mensagem ou tem permissão administrativa
  if (message.created_by !== user.id && user.role !== 1) { // role 1 = admin
    return NextResponse.json({ error: "Sem permissão para editar esta mensagem" }, { status: 403 });
  }

  // Atualiza a mensagem
  const { data: updatedMessage, error: updateError } = await supabase
    .from("message")
    .update({ is_private })
    .eq("id", messageId)
    .select("*");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedMessage || updatedMessage.length === 0) {
    return NextResponse.json({ error: "Nenhuma mensagem foi atualizada" }, { status: 404 });
  }

  return NextResponse.json(updatedMessage[0]);
}
