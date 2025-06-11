import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix") || "";
  const bucket = "numen-bucket";
  const supabase = await createClient();
  console.log("[LIST FILES API] Bucket:", bucket, "Prefix:", prefix);

  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, offset: 0 });
  if (error) {
    console.error("Erro ao listar arquivos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ files: data }, { status: 200 });
}
