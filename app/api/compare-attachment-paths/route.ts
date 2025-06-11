import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe um array de paths no body e compara com os arquivos do bucket
export async function POST(req: NextRequest) {
  const { paths = [] } = await req.json();
  const bucket = "numen-bucket";
  const supabase = await createClient();

  // Extrai todos os prefixes únicos dos paths recebidos
  const prefixes: string[] = Array.from(new Set(paths.map((p: string) => p.split("/")[0])));
  const allFiles: { [prefix: string]: string[] } = {};

  // Define the type for Supabase storage file objects
  type SupabaseStorageFile = {
    name: string;
    id?: string;
    updated_at?: string;
    created_at?: string;
    last_accessed_at?: string;
    metadata?: Record<string, unknown>;
  };

  // Lista arquivos de cada prefix
  for (const prefix of prefixes) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) {
      allFiles[prefix] = [];
      continue;
    }
    // Monta paths completos
    allFiles[prefix] = (data || []).map((f: SupabaseStorageFile) => prefix + "/" + f.name);
  }

  // Compara paths recebidos com os existentes
  const result = paths.map((p: string) => {
    const prefix = p.split("/")[0];
    const files = allFiles[prefix] || [];
    const exists = files.includes(p);
    // Sugestão: nomes parecidos (case insensitive)
    const suggestions = files.filter(f => f.toLowerCase() === p.toLowerCase() && f !== p);
    return { path: p, exists, suggestions };
  });

  return NextResponse.json({ result, allFiles }, { status: 200 });
}
