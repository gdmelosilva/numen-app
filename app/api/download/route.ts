import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  const bucket = "numen-bucket";
  if (!path) return NextResponse.json({ error: "Path obrigatório" }, { status: 400 });

  const supabase = await createClient();
  // LOG para debug
  console.log("[DOWNLOAD API] Bucket:", bucket, "Path:", path);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60); // 1 hora

  if (error || !data?.signedUrl) {
    console.error("Erro ao gerar signed URL do Supabase:", error, path, data);
    return NextResponse.json({ error: error?.message || "Erro ao gerar URL" }, { status: 500 });
  }
  // Redireciona para a URL assinada
  return NextResponse.redirect(data.signedUrl);
}
