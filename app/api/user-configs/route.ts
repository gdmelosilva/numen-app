import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";
import { UserConfig } from "@/types/user_configs";

export async function PUT(request: Request) {
  const { user, error } = await authenticateRequest();
  if (error || !user) return error;

  const body: Partial<UserConfig> = await request.json();

  // Only allow updating theme_id and table_id
  const updateFields: Partial<UserConfig> = {};
  if ("theme_id" in body) updateFields.theme_id = body.theme_id;
  if ("table_id" in body) updateFields.table_id = body.table_id;

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