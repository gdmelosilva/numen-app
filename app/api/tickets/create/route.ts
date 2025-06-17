import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Detecta se é multipart/form-data
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const contractId = formData.get("contractId") as string;
    const partner_id = formData.get("partner_id") as string | null;
    const title = formData.get("title") as string;
    const category_id = formData.get("category_id") as string;
    const module_id = formData.get("module_id") as string;
    const priority_id = formData.get("priority_id") as string;
    const description = formData.get("description") as string;
    const attachment = formData.get("file") as File | null;

    // Validação detalhada dos campos obrigatórios (FormData)
    const missingFields = [];
    if (!contractId) missingFields.push('contractId');
    if (!partner_id) missingFields.push('partner_id');
    if (!title) missingFields.push('title');
    if (!category_id) missingFields.push('category_id');
    if (!module_id) missingFields.push('module_id');
    if (!priority_id) missingFields.push('priority_id');
    if (!description) missingFields.push('description');
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Campo(s) obrigatório(s) faltando: ${missingFields.join(', ')}` }, { status: 400 });
    }

    // Cria o ticket
    const { data: ticket, error } = await supabase
      .from("ticket")
      .insert([
        {
          project_id: contractId,
          partner_id,
          title,
          category_id: Number(category_id),
          module_id: Number(module_id),
          priority_id: Number(priority_id),
          description,
          type_id: 1, // AMS
          status_id: 1, // Pendente ou status inicial padrão
          is_closed: false,
          is_private: false,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se houver anexo, faz upload e cria registro na tabela attachment
    if (attachment && ticket?.id) {
      const fileExt = attachment.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${ticket.id}/${fileName}`;
      // Upload para o bucket do Supabase
      const { error: uploadError } = await supabase.storage
        .from("numen-bucket")
        .upload(filePath, attachment, { contentType: attachment.type });
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
      // Insere registro na tabela attachment
      const insertData = {
        path: filePath,
        name: attachment.name,
        mime_type: attachment.type,
        uploaded_at: new Date().toISOString(),
        att_type: formData.get("att_type") as string | undefined,
      };
      const { error: dbError } = await supabase.from("attachment").insert(insertData);
      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
    }
    return NextResponse.json(ticket);
  }

  // Fallback: JSON puro (sem anexo)
  const body = await req.json();
  const {
    contractId,
    partner_id,
    title,
    category_id,
    module_id,
    priority_id,
    description
  } = body;

  // Validação detalhada dos campos obrigatórios (JSON)
  const missingFieldsJson = [];
  if (!contractId) missingFieldsJson.push('contractId');
  if (!partner_id) missingFieldsJson.push('partner_id');
  if (!title) missingFieldsJson.push('title');
  if (!category_id) missingFieldsJson.push('category_id');
  if (!module_id) missingFieldsJson.push('module_id');
  if (!priority_id) missingFieldsJson.push('priority_id');
  if (!description) missingFieldsJson.push('description');
  if (missingFieldsJson.length > 0) {
    return NextResponse.json({ error: `Campo(s) obrigatório(s) faltando: ${missingFieldsJson.join(', ')}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ticket")
    .insert([
      {
        project_id: contractId,
        partner_id,
        title,
        category_id: Number(category_id),
        module_id: Number(module_id),
        priority_id: Number(priority_id),
        description,
        type_id: 1, // AMS
        status_id: 1, // Pendente ou status inicial padrão
        is_closed: false,
        is_private: false,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
