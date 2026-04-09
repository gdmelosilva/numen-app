import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  // Verifica autenticação do usuário
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const messageId = formData.get("messageId") as string | null;
  const ticketId = formData.get("ticketId") as string | null;
  
  if (!file || (!messageId && !ticketId)) {
    return NextResponse.json({ error: "Arquivo, messageId ou ticketId ausente." }, { status: 400 });
  }
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${messageId || ticketId}/${fileName}`;

  // Upload para o bucket do Supabase
  const { error } = await supabase.storage
    .from("numen-bucket")
    .upload(filePath, file, { contentType: file.type });
  
  if (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insere registro na tabela attachment
  // Nota: tabela attachment NÃO tem ticket_id, apenas message_id
  const insertData = {
    path: filePath,
    name: file.name,
    mime_type: file.type,
    uploaded_at: new Date().toISOString(),
    ...(messageId && { message_id: messageId }),
  };
  
  const { error: dbError } = await supabase.from("attachment").insert(insertData);
  if (dbError) {
    console.error("Erro ao inserir attachment no banco:", dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Retorna também a URL pública do arquivo
  const { data: publicUrlData } = supabase.storage.from("numen-bucket").getPublicUrl(filePath);

  return NextResponse.json({ success: true, path: filePath, url: publicUrlData?.publicUrl });
}

export async function GET(req: NextRequest) {
  // Verifica autenticação do usuário
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("message_id") || searchParams.get("messageId");
  
  if (!messageId) {
    return NextResponse.json({ error: "message_id ausente." }, { status: 400 });
  }

  // Busca todos os anexos da mensagem (remover busca por ticket_id que não existe)
  const { data, error } = await supabase
    .from("attachment")
    .select("id, name, path, message_id, created_at, att_type")
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar attachments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
