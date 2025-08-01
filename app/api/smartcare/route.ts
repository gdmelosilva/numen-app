import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  category?: { id: number; name: string };
  type?: { id: number; name: string };
  module?: { id: number; name: string };
  status?: { id: number; name: string };
  priority?: { id: number; name: string };
  partner?: { id: string; partnerDesc: string };
  project?: { id: string; projectName: string };
  created_by_user?: { id: string; name: string };
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
    created_by_user: r.created_by_user,
    attachments: r.attachments || [],
    resources: r.ticket_resource || [],
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from("ticket")
    .select(`*,
    module:fk_module(*),
    partner:fk_partner(*),
    priority:fk_priority(*),
    category:fk_category(*),
    status:fk_status(*),
    type:fk_type(*),
    project:fk_project(*),
    created_by: ticket_created_by_fkey(*),
    ticket_resource(
      *,
      user:user_id(id, first_name, last_name, email, is_client, is_active)
    )
    `, { count: "exact" })
    .eq("type_id", 1);

  // Filtering
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
  if (searchParams.get("partner_id")) {
    query = query.eq("partner_id", searchParams.get("partner_id"));
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

  // Filter by user_tickets (for functional-adm users)
  if (searchParams.get("user_tickets")) {
    const userId = searchParams.get("user_tickets");
    // Get ticket IDs from ticket_resource where user_id matches
    const { data: ticketResources } = await supabase
      .from("ticket_resource")
      .select("ticket_id")
      .eq("user_id", userId);
    
    if (ticketResources && ticketResources.length > 0) {
      const ticketIds = ticketResources.map(tr => tr.ticket_id);
      query = query.in("id", ticketIds);
    } else {
      // No tickets for this user, return empty result
      // Usar uma condição que nunca será verdadeira para garantir lista vazia
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  // Filter by resource_user_id (for admin filtering by specific user)
  if (searchParams.get("resource_user_id")) {
    const resourceUserId = searchParams.get("resource_user_id");
    // Get ticket IDs from ticket_resource where user_id matches
    const { data: ticketResources } = await supabase
      .from("ticket_resource")
      .select("ticket_id")
      .eq("user_id", resourceUserId);
    
    if (ticketResources && ticketResources.length > 0) {
      const ticketIds = ticketResources.map(tr => tr.ticket_id);
      query = query.in("id", ticketIds);
    } else {
      // No tickets for this user, return empty result
      // Usar uma condição que nunca será verdadeira para garantir lista vazia
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
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
