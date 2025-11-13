import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";
import { UserConfig } from "@/types/user_configs";

export async function PUT(request: Request): Promise<NextResponse> {
  const { user, error } = await authenticateRequest();
  if (error || !user) return error!;

  const body: Partial<UserConfig> = await request.json();

  // Allow updating theme_id, table_id, and ticket_update_notification
  const updateFields: Partial<UserConfig> = {};
  if ("theme_id" in body) updateFields.theme_id = body.theme_id;
  if ("table_id" in body) updateFields.table_id = body.table_id;
  if ("ticket_update_notification" in body) updateFields.ticket_update_notification = body.ticket_update_notification;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error: updateError, data } = await supabase
    .from("user_configs")
    .update({
      ...updateFields,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const { user, error } = await authenticateRequest();
  if (error || !user) return error!;

  const url = new URL(request.url);
  const userIdParam = url.searchParams.get('user_id');
  const userIdsParam = url.searchParams.get('user_ids');
  const fieldsParam = url.searchParams.get('fields');

  let ids: string[] = [];
  if (userIdsParam) {
    ids = userIdsParam.split(',').map(id => id.trim()).filter(Boolean);
  } else if (userIdParam) {
    ids = [userIdParam];
  } else {
    ids = [user.id];
  }

  // Definir os campos a serem retornados
  let selectFields = '*';
  if (fieldsParam) {
    const fields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean);
    if (fields.length > 0) {
      selectFields = fields.join(',');
    }
  }

  const supabase = await createClient();
  const { data, error: getError } = await supabase
    .from("user_configs")
    .select(selectFields)
    .in("user_id", ids);

  if (getError) {
    return NextResponse.json(
      { error: getError.message },
      { status: 500 }
    );
  }

  // Se só um id foi solicitado, retorna objeto único, senão retorna array
  if (ids.length === 1) {
    const result = data?.[0] ?? null;
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json(data || [], { status: 200 });
}