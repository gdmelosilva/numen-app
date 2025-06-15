import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/user-partner/available-for-project?project_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) {
    return NextResponse.json({ error: "project_id é obrigatório" }, { status: 400 });
  }
  const supabase = await createClient();

  // Busca todos os recursos vinculados ao projeto, incluindo user_functional e join com ticket_modules
  const { data: resources, error: resourcesError } = await supabase
    .from("project_resources")
    .select(`user_id, user_functional: project_resources_user_functional_fkey(id, name)`)
    .eq("project_id", project_id);
  if (resourcesError) {
    return NextResponse.json({ error: resourcesError.message }, { status: 500 });
  }
  const linkedIds = Array.isArray(resources) ? resources.map((r) => r.user_id) : [];
  if (linkedIds.length === 0) {
    return NextResponse.json([]);
  }

  // Busca todos os usuários ativos, não clientes, que estão em linkedIds
  const { data: users, error: usersError } = await supabase
    .from("user")
    .select("id, first_name, last_name, email, is_verified, is_active, is_client, tel_contact, role, users_partner_id_fkey(id, partner_desc)")
    .eq("is_active", true)
    .eq("is_client", false)
    .in("id", linkedIds);
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Junta os dados do usuário com o módulo funcional
  const usersWithFunctional = users.map(u => {
    const resource = resources.find(r => r.user_id === u.id);
    const user_functional = resource?.user_functional || { id: null, name: null };
    let user_functional_name = null;
    if (Array.isArray(user_functional)) {
      user_functional_name = user_functional.length > 0 ? user_functional[0].id : null;
    } else {
      user_functional_name = user_functional.name;
    }
    return {
      ...u,
      user_functional_name
    //   ticket_module: Array.isArray(resource?.ticket_modules) && resource.ticket_modules.length > 0 ? resource.ticket_modules[0].name : null,
    };
  });

  return NextResponse.json(usersWithFunctional);
}
