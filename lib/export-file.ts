import type { Role } from "@/types/roles";
import type { Ticket } from "@/types/tickets";
import type { Partner } from "@/types/partners";
import type { Contract } from "@/types/contracts";
import * as XLSX from "xlsx";

// Função para buscar horas estimadas de múltiplos tickets
async function fetchTicketsEstimatedHours(tickets: Ticket[], userIsClient: boolean = false): Promise<Record<string, number>> {
  const estimatedHours: Record<string, number> = {};
  
  try {
    // Buscar mensagens para todos os tickets de uma vez
    const ticketIds = tickets.map(ticket => ticket.id).filter(Boolean);
    
    if (ticketIds.length === 0) return estimatedHours;
    
    const promises = ticketIds.map(async (ticketId) => {
      try {
        const response = await fetch(`/api/messages?ticket_id=${ticketId}`);
        if (!response.ok) return { ticketId, hours: 0 };
        
        const messages = await response.json();
        let totalHours = 0;
        
        if (Array.isArray(messages)) {
          totalHours = messages.reduce((sum, msg) => {
            // Para usuários clientes, só considerar mensagens não-privadas
            if (userIsClient && msg.is_private) {
              return sum;
            }
            
            const hours = typeof msg.hours === 'number' ? msg.hours : 
                         typeof msg.hours === 'string' ? parseFloat(msg.hours) : 0;
            return sum + (isNaN(hours) ? 0 : hours);
          }, 0);
        }
        
        return { ticketId, hours: totalHours };
      } catch {
        return { ticketId, hours: 0 };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ ticketId, hours }) => {
      estimatedHours[ticketId] = hours;
    });
    
  } catch {
    // Silently handle errors
  }
  
  return estimatedHours;
}

export function exportToCSV(data: Role[], filename: string): void;
export function exportToCSV(data: Record<string, unknown>[], filename: string): void;
export function exportToCSV<T extends object>(data: T[], filename: string): void {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, unknown>)[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value).includes(",") ? `"${value}"` : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Função genérica para exportar para Excel
export function exportToExcel<T extends object>(
  data: T[],
  filename: string,
  sheetName: string = "Data"
): void {
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Função específica para exportar tickets para Excel
export async function exportTicketsToExcel(
  tickets: Ticket[], 
  filename: string = "chamados",
  userIsClient: boolean = false
): Promise<void> {
  if (!tickets.length) return;

  // Buscar horas estimadas para todos os tickets
  const estimatedHours = await fetchTicketsEstimatedHours(tickets, userIsClient);

  // Transformar os dados para um formato mais legível
  const exportData = tickets.map((ticket) => {
    // Formatar recursos vinculados
    const resources = ticket.resources || [];
    const resourcesText = resources.length > 0 
      ? resources.map(resource => {
          const user = resource.user;
          if (user) {
            const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            const displayName = name || user.email || user.id;
            return resource.is_main ? `${displayName} (Principal)` : displayName;
          }
          return resource.user_id;
        }).join("; ")
      : "Nenhum recurso vinculado";

    // Usar horas estimadas calculadas dinamicamente
    const ticketHours = estimatedHours[ticket.id] || 0;

    return {
      "ID": ticket.external_id,
      "Título": ticket.title,
      "Descrição": ticket.description,
      "Horas Estimadas": ticketHours,
      "Status": ticket.status?.name || ticket.status_id,
      "Categoria": ticket.category?.name || ticket.category_id,
      "Tipo": ticket.type?.name || ticket.type_id,
      "Módulo": ticket.module?.name || ticket.module_id,
      "Prioridade": ticket.priority?.name || ticket.priority_id,
      "Parceiro": ticket.partner?.partner_desc || ticket.partner_id,
      "Projeto": ticket.project?.projectName || ticket.project_id,
      "Criado por": ticket.created_by_user 
        ? `${ticket.created_by_user.first_name} ${ticket.created_by_user.last_name}`.trim()
        : ticket.created_by,
      "Recursos Vinculados": resourcesText,
      "Encerrado": ticket.is_closed ? "Sim" : "Não",
      "Privado": ticket.is_private ? "Sim" : "Não",
      "Data de Criação": new Date(ticket.created_at).toLocaleDateString("pt-BR"),
      "Data Prevista": ticket.planned_end_date 
        ? new Date(ticket.planned_end_date).toLocaleDateString("pt-BR") 
        : "",
      "Data Real": ticket.actual_end_date 
        ? new Date(ticket.actual_end_date).toLocaleDateString("pt-BR") 
        : "",
      "Última Atualização": new Date(ticket.updated_at).toLocaleDateString("pt-BR"),
    };
  });

  exportToExcel(exportData, filename, "Chamados");
}

// Função específica para exportar usuários para Excel
export function exportUsersToExcel(users: Record<string, unknown>[], filename: string = "usuarios"): void {
  if (!users.length) return;

  const exportData = users.map((user) => ({
    "ID": user.id,
    "Nome": `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    "Email": user.email,
    "Telefone": user.tel_contact || "",
    "Perfil": (user.role as Record<string, unknown>)?.title || "",
    "Parceiro": (user.partner as Record<string, unknown>)?.partner_desc || "",
    "Ativo": user.active ? "Sim" : "Não",
    "Cliente": user.is_client ? "Sim" : "Não",
    "Data de Criação": user.created_at ? new Date(user.created_at as string).toLocaleDateString("pt-BR") : "",
    "Última Atualização": user.updated_at ? new Date(user.updated_at as string).toLocaleDateString("pt-BR") : "",
  }));

  exportToExcel(exportData, filename, "Usuários");
}

// Função específica para exportar parceiros para Excel
export function exportPartnersToExcel(partners: Partner[], filename: string = "parceiros"): void {
  if (!partners.length) return;

  const exportData = partners.map((partner) => ({
    "ID": partner.id,
    "ID Externo": partner.partner_ext_id || "",
    "Nome": partner.partner_desc,
    "Identificador": partner.partner_ident || "",
    "Email": partner.partner_email || "",
    "Telefone": partner.partner_tel || "",
    "Segmento": partner.partner_segment?.name || "",
    "Tipo": partner.is_compadm ? "Administrador" : "Cliente",
    "Status": partner.is_active ? "Ativo" : "Inativo",
  }));

  exportToExcel(exportData, filename, "Parceiros");
}

// Função específica para exportar contratos para Excel
export function exportContractsToExcel(contracts: Contract[], filename: string = "contratos"): void {
  if (!contracts.length) return;

  const exportData = contracts.map((contract) => ({
    "ID": contract.id,
    "ID Externo": contract.projectExtId || "",
    "Código": contract.projectName || "",
    "Descrição": contract.projectDesc || "",
    "Parceiro": contract.partner?.partner_desc || "",
    "Tipo": contract.project_type || "",
    "Status": contract.project_status?.name || "",
    "24/7": contract.is_247 ? "Sim" : "Não",
    "Wildcard": contract.is_wildcard ? "Sim" : "Não",
    "Data de Início": contract.start_date ? new Date(contract.start_date).toLocaleDateString("pt-BR") : "",
    "Data de Fim": contract.end_at ? new Date(contract.end_at).toLocaleDateString("pt-BR") : "",
  }));

  exportToExcel(exportData, filename, "Contratos");
}

// Função específica para exportar projetos AMS para Excel
export function exportProjectsToExcel(projects: Record<string, unknown>[], filename: string = "projetos_ams"): void {
  if (!projects.length) return;

  const exportData = projects.map((project) => ({
    "ID": project.id,
    "ID Externo": project.projectExtId || "",
    "Nome": project.projectName || "",
    "Descrição": project.projectDesc || "",
    "Parceiro": (project.partner as Record<string, unknown>)?.partner_desc || "",
    "Tipo": (project.project_type as Record<string, unknown>)?.name || "",
    "Status": (project.project_status as Record<string, unknown>)?.name || "",
    "24/7": project.is_247 ? "Sim" : "Não",
    "Wildcard": project.is_wildcard ? "Sim" : "Não",
    "Data de Início": project.start_date ? new Date(project.start_date as string).toLocaleDateString("pt-BR") : "",
    "Data de Fim": project.end_at ? new Date(project.end_at as string).toLocaleDateString("pt-BR") : "",
    "Data de Criação": project.created_at ? new Date(project.created_at as string).toLocaleDateString("pt-BR") : "",
    "Última Atualização": project.updated_at ? new Date(project.updated_at as string).toLocaleDateString("pt-BR") : "",
  }));

  exportToExcel(exportData, filename, "Projetos AMS");
}

// Função específica para exportar atividades Smartbuild para Excel
export async function exportActivitiesToExcel(
  activities: Ticket[], 
  filename: string = "atividades",
  userIsClient: boolean = false
): Promise<void> {
  if (!activities.length) return;

  // Buscar horas estimadas para todas as atividades
  const estimatedHours = await fetchTicketsEstimatedHours(activities, userIsClient);

  const exportData = activities.map((activity) => {
    // Usar horas estimadas calculadas dinamicamente
    const activityHours = estimatedHours[activity.id] || 0;

    return {
      "ID": activity.external_id,
      "Título": activity.title,
      "Descrição": activity.description,
      "Horas": activityHours,
      "Status": activity.status?.name || activity.status_id,
      "Categoria": activity.category?.name || activity.category_id,
      "Tipo": activity.type?.name || activity.type_id,
      "Prioridade": activity.priority?.name || activity.priority_id,
      "Projeto": activity.project?.projectName || activity.project_id,
      "Encerrado": activity.is_closed ? "Sim" : "Não",
      "Data de Criação": new Date(activity.created_at).toLocaleDateString("pt-BR"),
      "Data Prevista": activity.planned_end_date 
        ? new Date(activity.planned_end_date).toLocaleDateString("pt-BR") 
        : "",
      "Data Real": activity.actual_end_date 
        ? new Date(activity.actual_end_date).toLocaleDateString("pt-BR") 
        : "",
      "Última Atualização": new Date(activity.updated_at).toLocaleDateString("pt-BR"),
    };
  });

  exportToExcel(exportData, filename, "Atividades");
}

// Função específica para exportar relatório de horas de apontamento
export function exportTimesheetReport(
  data: Array<{
    id: string;
    appoint_date: string;
    children?: Array<{
      id: string;
      appoint_date: string;
      total_minutes: number;
      is_approved: boolean;
      user_name?: string;
      project?: { projectName: string };
      ticket_id?: string;
      ticket_title?: string;
      ticket_external_id?: string;
      appoint_start?: string;
      appoint_end?: string;
      ticket?: {
        status?: { name: string };
        ref_external_id?: string;
        module?: { name: string };
        category?: { name: string };
      };
    }>;
  }>, 
  filename: string = "relatorio-horas-apontamento",
  filterUserId?: string | null
): void {
  if (!data.length) return;

  // Transformar os dados para um formato de relatório detalhado
  const exportData: Array<{
    Data: string;
    Projeto: string;
    'ID Ticket': string;
    'Título Ticket': string;
    'Horas': number;
    'Hora Inicial': string;
    'Hora Final': string;
    'Usuário': string;
    'Status': string;
    'Status do Ticket': string;
    'Identificação Externa': string;
    'Módulo': string;
    'Categoria Chamado': string;
  }> = [];

  data.forEach(row => {
    if (row.children && row.children.length > 0) {
      row.children.forEach(child => {
        // Formatar data para formato brasileiro
        const date = new Date(child.appoint_date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Converter minutos para horas (como número)
        const hours = (child.total_minutes || 0) / 60;
        
        exportData.push({
          Data: formattedDate,
          Projeto: child.project?.projectName || '-',
          'ID Ticket': child.ticket_external_id || '-',
          'Título Ticket': child.ticket_title || '-',
          'Horas': Number(hours.toFixed(2)),
          'Hora Inicial': child.appoint_start || '-',
          'Hora Final': child.appoint_end || '-',
          'Usuário': child.user_name || '-',
          'Status': child.is_approved ? 'Aprovado' : 'Pendente',
          'Status do Ticket': child.ticket?.status?.name || '-',
          'Identificação Externa': child.ticket?.ref_external_id || '-',
          'Módulo': child.ticket?.module?.name || '-',
          'Categoria Chamado': child.ticket?.category?.name || '-'
        });
      });
    }
  });

  // Ordenar por data
  exportData.sort((a, b) => {
    const dateA = new Date(a.Data.split('/').reverse().join('-'));
    const dateB = new Date(b.Data.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  // Adicionar informações do filtro no nome do arquivo se aplicável
  let finalFilename = filename;
  if (filterUserId) {
    finalFilename += `-filtrado`;
  }

  exportToExcel(exportData, finalFilename, "Relatório de Horas");
}