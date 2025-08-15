import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest, AuthenticatedUser } from "@/lib/api-auth";

// Tipos para perfis de usuário
type UserProfile =
  | 'admin-adm'
  | 'manager-adm' 
  | 'functional-adm'
  | 'admin-client'
  | 'manager-client'
  | 'functional-client'
  | null;

// Função para determinar o perfil do usuário
function getUserProfile(user: AuthenticatedUser): UserProfile {
  if (!user) return null;
  const role = typeof user.role === 'number' ? user.role : Number(user.role);
  const profileMap: Record<string, Record<number, UserProfile>> = {
    adm: {
      1: 'admin-adm',      // Admin
      2: 'manager-adm',    // Manager  
      3: 'functional-adm', // Functional
    },
    client: {
      1: 'admin-client',      // Admin
      2: 'manager-client',    // Manager
      3: 'functional-client', // Functional
    },
  };
  const key = user.is_client ? 'client' : 'adm';
  return profileMap[key][role] ?? null;
}

// Helper to map DB row to frontend Ticket type
interface TicketRow {
  id: string;
  external_id: string;
  title: string;
  description: string;
  hours: number | null;
  is_closed: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  planned_end_date: string | null;
  actual_end_date: string | null;
  category_id: number;
  type_id: number;
  module_id: number;
  status_id: number;
  priority_id: number;
  partner_id: string;
  project_id: string;
  created_by: string;
  ref_ticket_id?: string | number | null;
  ref_external_id?: string | null;
  category?: { id: number; name: string; is_ams?: boolean; is_active?: boolean };
  type?: { id: number; name: string; is_active?: boolean };
  module?: { id: number; name: string; is_active?: boolean };
  status?: { id: number; name: string; color?: string; is_active?: boolean };
  priority?: { id: number; name: string; is_active?: boolean };
  partner?: { id: string; partner_desc: string; is_active?: boolean };
  project?: { id: string; projectName: string; endAt?: string | null; end_at?: string | null; is_247?: boolean };
  created_by_user?: { id: string; first_name?: string; last_name?: string; email?: string; is_client?: boolean };
  attachments?: { id: string; name: string; path: string }[];
  ticket_resource?: { 
    user_id: string; 
    ticket_id: string; 
    is_main: boolean;
    user?: { 
      id: string; 
      first_name?: string; 
      last_name?: string; 
      email?: string; 
      is_client?: boolean; 
      is_active?: boolean; 
    };
  }[];
  resources?: { 
    id?: string; 
    user_id: string; 
    ticket_id: string; 
    is_main: boolean;
    user?: { 
      id: string; 
      first_name?: string; 
      last_name?: string; 
      email?: string; 
      is_client?: boolean; 
      is_active?: boolean; 
    };
  }[];
}

function mapTicketRow(row: unknown) {
  const r = row as TicketRow;
  return {
    id: r.id,
    external_id: r.external_id,
    title: r.title,
    description: r.description,
    hours: r.hours,
    is_closed: r.is_closed,
    is_private: r.is_private,
    created_at: r.created_at,
    updated_at: r.updated_at,
    planned_end_date: r.planned_end_date,
    actual_end_date: r.actual_end_date,
    category_id: r.category_id,
    type_id: r.type_id,
    module_id: r.module_id,
    status_id: r.status_id,
    priority_id: r.priority_id,
    partner_id: r.partner_id,
    project_id: r.project_id,
    created_by: r.created_by,
    ref_ticket_id: r.ref_ticket_id,
    ref_external_id: r.ref_external_id,
    category: r.category,
    type: r.type,
    module: r.module,
    status: r.status,
    priority: r.priority,
    partner: r.partner,
    project: r.project,
    created_by_user: r.created_by,
    attachments: r.attachments || [],
    resources: r.ticket_resource || [],
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  // Autenticar usuário
  const { user, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Determinar perfil do usuário
  const profile = getUserProfile(user);

  let query = supabase
    .from("ticket")
    .select(`*,
    category:fk_category(id, name, is_ams, is_active),
    type:fk_type(id, name, is_active),
    module:fk_module(id, name, is_active),
    status:fk_status(id, name, color, is_active),
    priority:fk_priority(id, name, is_active),
    partner:fk_partner(id, partner_desc, is_active),
    project:fk_project(id, projectName, endAt, end_at, is_247),
    created_by:ticket_created_by_fkey(id, first_name, last_name, email, is_client),
    ticket_resource(
      *,
      user:user_id(id, first_name, last_name, email, is_client, is_active)
    )
    `, { count: "exact" })
    .eq("type_id", 1);

  // Aplicar filtros automáticos OBRIGATÓRIOS baseados no perfil
  // Estes filtros NUNCA podem ser removidos pelo frontend
  let securityTicketIds: string[] | null = null;
  
  switch (profile) {
    case "admin-client":
    case "manager-client":
    case "functional-client":
      // Clientes: SEMPRE filtrar apenas tickets do seu parceiro
      if (user.partner_id) {
        query = query.eq("partner_id", user.partner_id);
      } else {
        // Se cliente não tem partner_id, não pode ver nenhum ticket
        return NextResponse.json([]);
      }
      break;
      
    case "functional-adm": {
      // Functional-adm: SEMPRE filtrar apenas tickets onde está alocado como recurso
      const { data: ticketResources } = await supabase
        .from("ticket_resource")
        .select("ticket_id")
        .eq("user_id", user.id);
      
      if (ticketResources && ticketResources.length > 0) {
        securityTicketIds = ticketResources.map(tr => tr.ticket_id);
        query = query.in("id", securityTicketIds);
      } else {
        // Se não tem tickets alocados, retornar lista vazia
        return NextResponse.json([]);
      }
      break;
    }
    
    case "admin-adm":
    case "manager-adm":
    default:
      // Admin-adm e Manager-adm: acesso total, sem filtros automáticos obrigatórios
      break;
  }

  // Aplicar filtros manuais do frontend (AGREGADOS aos filtros automáticos de segurança)
  if (searchParams.get("external_id")) {
    query = query.eq("external_id", searchParams.get("external_id"));
  }
  if (searchParams.get("title")) {
    query = query.ilike("title", `%${searchParams.get("title")}%`);
  }
  if (searchParams.get("description")) {
    query = query.ilike("description", `%${searchParams.get("description")}%`);
  }
  if (searchParams.get("category_id")) {
    query = query.eq("category_id", searchParams.get("category_id"));
  }
  if (searchParams.get("type_id")) {
    query = query.eq("type_id", searchParams.get("type_id"));
  }
  if (searchParams.get("module_id")) {
    query = query.eq("module_id", searchParams.get("module_id"));
  }
  if (searchParams.get("status_id")) {
    query = query.eq("status_id", searchParams.get("status_id"));
  }
  if (searchParams.get("priority_id")) {
    query = query.eq("priority_id", searchParams.get("priority_id"));
  }
  
  // Filtro de parceiro - validar permissões
  if (searchParams.get("partner_id")) {
    const requestedPartnerId = searchParams.get("partner_id");
    
    // Para perfis de cliente, ignorar filtro manual de parceiro (já aplicado automaticamente)
    if (profile === "admin-adm" || profile === "manager-adm") {
      // Apenas admin-adm e manager-adm podem filtrar por qualquer parceiro
      query = query.eq("partner_id", requestedPartnerId);
    }
    // Para clientes, o filtro de parceiro já foi aplicado automaticamente acima
  }
  
  if (searchParams.get("project_id")) {
    query = query.eq("project_id", searchParams.get("project_id"));
  }
  if (searchParams.get("created_by")) {
    query = query.eq("created_by", searchParams.get("created_by"));
  }
  if (searchParams.get("is_closed")) {
    const val = searchParams.get("is_closed");
    if (val === "true" || val === "false") query = query.eq("is_closed", val === "true");
  }
  if (searchParams.get("is_private")) {
    const val = searchParams.get("is_private");
    if (val === "true" || val === "false") query = query.eq("is_private", val === "true");
  }
  if (searchParams.get("created_at")) {
    query = query.gte("created_at", searchParams.get("created_at"));
  }
  if (searchParams.get("planned_end_date")) {
    query = query.gte("planned_end_date", searchParams.get("planned_end_date"));
  }
  if (searchParams.get("actual_end_date")) {
    query = query.gte("actual_end_date", searchParams.get("actual_end_date"));
  }
  if (searchParams.get("ref_ticket_id")) {
    query = query.eq("ref_ticket_id", searchParams.get("ref_ticket_id"));
  }
  if (searchParams.get("ref_external_id")) {
    query = query.ilike("ref_external_id", `%${searchParams.get("ref_external_id")}%`);
  }

  // Filtro manual user_tickets - validar com filtros de segurança
  if (searchParams.get("user_tickets")) {
    const userId = searchParams.get("user_tickets");
    
    if (profile === "functional-adm") {
      // Para functional-adm, o filtro de recursos já foi aplicado automaticamente
      // Ignorar filtro manual redundante para evitar conflitos
    } else if (profile === "admin-adm" || profile === "manager-adm") {
      // Admin e Manager podem filtrar por qualquer usuário
      const { data: ticketResources } = await supabase
        .from("ticket_resource")
        .select("ticket_id")
        .eq("user_id", userId);
      
      if (ticketResources && ticketResources.length > 0) {
        const ticketIds = ticketResources.map(tr => tr.ticket_id);
        query = query.in("id", ticketIds);
      } else {
        // Retornar lista vazia se não há tickets para o usuário
        return NextResponse.json([]);
      }
    }
    // Para clientes, ignorar este filtro (não têm permissão)
  }

  // Filtro por resource_user_id (para admin filtrar por usuário específico)
  if (searchParams.get("resource_user_id")) {
    const resourceUserId = searchParams.get("resource_user_id");
    
    if (profile === "admin-adm" || profile === "manager-adm") {
      // Apenas admin-adm e manager-adm podem usar este filtro
      const { data: ticketResources } = await supabase
        .from("ticket_resource")
        .select("ticket_id")
        .eq("user_id", resourceUserId);
      
      if (ticketResources && ticketResources.length > 0) {
        const ticketIds = ticketResources.map(tr => tr.ticket_id);
        query = query.in("id", ticketIds);
      } else {
        // Retornar lista vazia se não há tickets para o usuário
        return NextResponse.json([]);
      }
    }
    // Para functional-adm, este filtro seria ignorado pois eles já têm filtro de segurança aplicado
    // Para outros perfis, ignorar este filtro (não têm permissão)
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json([]);
  }

  // Map DB rows to frontend shape usando o join direto
  const tickets = data.map(ticket => mapTicketRow(ticket));

  return NextResponse.json(tickets);
}

// PUT method to update ticket
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("id");
  
  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
  }

  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { planned_end_date } = body;

    if (!planned_end_date) {
      return NextResponse.json({ error: "planned_end_date is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ticket")
      .update({ 
        planned_end_date: planned_end_date,
        updated_at: new Date().toISOString(),
        updated_by: user.id // Incluir updated_by na atualização
      })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
