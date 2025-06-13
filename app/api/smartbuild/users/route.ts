import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");
  const is_client = searchParams.get("is_client");
  const partner_id = searchParams.get("partner_id");

  const supabase = await createClient();

  // Se project_id, mantém comportamento atual
  if (project_id) {
    const { data, error } = await supabase
      .from("project_resources")
      .select(`id, user:id, max_hours, user_functional, ticket_modules:user_functional(id, name), user!inner(id, first_name, last_name, email, tel_contact, is_active, role, is_client)`)
      .eq("project_id", project_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    interface ProjectResourceRow {
      id: number;
      user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        tel_contact: string;
        is_active: boolean;
        role: number;
        is_client: boolean;
      };
      max_hours: number | null;
      user_functional?: number;
      ticket_modules?: { id: number; name: string } | { id: number; name: string }[] | null;
    }
    const users = (data || []).map((row: ProjectResourceRow) => ({
      ...row.user,
      hours_max: row.max_hours,
      user_functional: (() => {
        if (Array.isArray(row.ticket_modules)) return row.ticket_modules[0]?.name ?? null;
        if (row.ticket_modules && typeof row.ticket_modules === 'object') return row.ticket_modules.name ?? null;
        return null;
      })(),
      project_resource_id: row.id,
    }));
    return NextResponse.json(users);
  }

  // Se is_client está presente, busca usuários conforme filtro
  if (is_client !== null) {
    let query = supabase.from("user").select("id, first_name, last_name, email, tel_contact, is_active, role, is_client, partner_id");
    query = query.eq("is_client", is_client === "true");
    if (is_client === "true" && partner_id) {
      query = query.eq("partner_id", partner_id);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  // Se não houver parâmetros válidos
  return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 });
}
