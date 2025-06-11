import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }  // Insere registro na tabela attachment
  const insertData = {
    path: filePath,
    name: file.name,
    mime_type: file.type,
    uploaded_at: new Date().toISOString(),
    ...(messageId && { message_id: messageId }),
  };
  
  const { error: dbError } = await supabase.from("attachment").insert(insertData);
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Retorna também a URL pública do arquivo
  const { data: publicUrlData } = supabase.storage.from("numen-bucket").getPublicUrl(filePath);

  return NextResponse.json({ success: true, path: filePath, url: publicUrlData?.publicUrl });
}
