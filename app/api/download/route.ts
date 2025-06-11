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

  // Primeiro, baixa o arquivo do Supabase
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(path);

  if (downloadError || !fileData) {
    console.error("Erro ao baixar arquivo do Supabase:", downloadError, path);
    return NextResponse.json({ error: downloadError?.message || "Arquivo não encontrado" }, { status: 404 });
  }

  // Extrai o nome do arquivo do path
  const fileName = path.split('/').pop() || 'download';
  
  // Converte o Blob para ArrayBuffer
  const arrayBuffer = await fileData.arrayBuffer();
  
  // Retorna o arquivo com headers apropriados para download
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': fileData.type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': arrayBuffer.byteLength.toString(),
    },
  });
}
