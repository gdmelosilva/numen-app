import type { Role } from "@/types/roles";
import type { Ticket } from "@/types/tickets";
import type { Partner } from "@/types/partners";
import type { Contract } from "@/types/contracts";
import * as XLSX from "xlsx";

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
export function exportTicketsToExcel(tickets: Ticket[], filename: string = "chamados"): void {
  if (!tickets.length) return;

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

    return {
      "ID": ticket.external_id,
      "Título": ticket.title,
      "Descrição": ticket.description,
      "Horas": ticket.hours || 0,
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
export function exportActivitiesToExcel(activities: Ticket[], filename: string = "atividades"): void {
  if (!activities.length) return;

  const exportData = activities.map((activity) => ({
    "ID": activity.external_id,
    "Título": activity.title,
    "Descrição": activity.description,
    "Horas": activity.hours || 0,
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
  }));

  exportToExcel(exportData, filename, "Atividades");
}