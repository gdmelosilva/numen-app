import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest) {
  try {
    const { ticket_id, status_id } = await req.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ticket")
      .update({ status_id })
      .eq("id", ticket_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: "Erro ao atualizar status do ticket.", details: error } },
      { status: 500 }
    );
  }
}
