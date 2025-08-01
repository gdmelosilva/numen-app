// Minimal valid Next.js route module
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const partnerId = searchParams.get("partnerId");

  // Autenticar usuário para endpoints que precisam de filtros baseados no usuário
  const needsAuth = ["user-allocated-partners", "user-allocated-projects"].includes(type || "");
  let user = null;
  
  if (needsAuth || (type === "partners" && partnerId)) {
    const { user: authenticatedUser, error: authError } = await authenticateRequest();
    if (authError) {
      return authError;
    }
    user = authenticatedUser;
  }

  if (type === "partners") {
    const supabase = await createClient();
    
    // Se tem partnerId específico (para clientes), buscar apenas esse parceiro
    if (partnerId) {
      const { data, error } = await supabase
        .from("partner")
        .select("id, name: partner_desc")
        .eq("is_active", true)
        .eq("id", partnerId);
      if (error) {
        return NextResponse.json([], { status: 200 });
      }
      return NextResponse.json(data || [], { status: 200 });
    }
    
    // Buscar todos os parceiros (comportamento original)
    const { data, error } = await supabase
      .from("partner")
      .select("id, name: partner_desc")
      .eq("is_active", true);
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "user-allocated-partners") {
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    
    const supabase = await createClient();
    
    // Buscar parceiros dos projetos em que o usuário está alocado
    const { data, error } = await supabase
      .from("project_resources")
      .select(`
        project:project_id (
          partner:partner_id (
            id,
            name: partner_desc
          )
        )
      `)
      .eq("user_id", user.id)
      .eq("is_suspended", false);
    
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Extrair parceiros únicos
    const partnersSet = new Set();
    const partners: { id: string; name: string }[] = [];
    
    (data as unknown[])?.forEach((item: unknown) => {
      const typedItem = item as { project?: { partner?: { id: string; name: string } } };
      const partner = typedItem.project?.partner;
      if (partner && !partnersSet.has(partner.id)) {
        partnersSet.add(partner.id);
        partners.push({
          id: partner.id,
          name: partner.name
        });
      }
    });
    
    return NextResponse.json(partners, { status: 200 });
  }

  if (type === "user-allocated-projects") {
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }
    
    const supabase = await createClient();
    
    // Buscar projetos em que o usuário está alocado
    const { data, error } = await supabase
      .from("project_resources")
      .select(`
        project:project_id (
          id,
          projectName,
          projectDesc,
          partner_id,
          project_type
        )
      `)
      .eq("user_id", user.id)
      .eq("is_suspended", false);
    
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Extrair projetos únicos e mapear para o formato esperado
    const projectsSet = new Set();
    const projects: { id: string; name: string; projectName?: string; projectDesc?: string; partner_id: string; project_type?: string }[] = [];
    
    (data as unknown[])?.forEach((item: unknown) => {
      const typedItem = item as { project?: { id: string; projectName?: string; projectDesc?: string; partner_id: string; project_type?: string } };
      const project = typedItem.project;
      if (project && !projectsSet.has(project.id)) {
        projectsSet.add(project.id);
        projects.push({
          id: project.id,
          name: project.projectName || project.projectDesc || project.id,
          projectName: project.projectName,
          projectDesc: project.projectDesc,
          partner_id: project.partner_id,
          project_type: project.project_type
        });
      }
    });
    
    return NextResponse.json(projects, { status: 200 });
  }

  if (type === "project_status") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("project_status")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

    if (type === "ticket_status") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_status")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "ticket_categories") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_categories")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

    if (type === "ticket_modules") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_modules")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "ticket_priorities") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_priorities")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  if (type === "ticket_types") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_types")
      .select("id, name");
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  }

  return NextResponse.json({ message: "OK" });
}
