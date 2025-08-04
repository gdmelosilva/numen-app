import { useState, useCallback } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface TicketHour {
  id: string;
  appoint_date: string;
  minutes: number;
  total_minutes?: number;
  is_approved: boolean;
  is_deleted: boolean;
  ticket_id?: string;
  appoint_start?: string;
  appoint_end?: string;
  user_id?: string;
  user_name?: string;
  project_id?: string;
  ticket_title?: string;
  ticket_type_id?: number;
  ticket_external_id?: string;
  hora_faturavel?: number | null;
  billable_minutes?: number;
  original_minutes?: number;
  children?: TicketHour[];
  user?: {
    first_name: string;
    last_name: string;
  };
  project?: {
    projectName: string;
    projectDesc: string;
  };
  ticket?: {
    title: string;
    type_id: number;
    external_id: string;
  };
}

export interface TimesheetRow {
  id: string;
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
  is_deleted?: boolean;
  user_name?: string;
  user_id?: string;
  project: {
    projectName: string;
    projectDesc: string;
  };
  children?: TicketHour[];
  // Campos adicionais para TicketHour
  ticket_id?: string;
  project_id?: string;
  appoint_start?: string;
  appoint_end?: string;
  ticket_title?: string;
  ticket_type_id?: number;
  ticket_external_id?: string;
}

export function useTicketHoursManagement() {
  const [data, setData] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: userLoading } = useCurrentUser();

  const fetchTicketHours = useCallback(async (year?: number, month?: number, filterUserId?: string | null) => {
    if (userLoading || !user) return;
    setLoading(true);
    try {
      let apiUrl = "/api/ticket-hours";
      const params = new URLSearchParams();

      // Aplicar regras de visibilidade baseadas no perfil do usuário
      if (!user.is_client && user.role === 3) {
        // Role 3 (Recurso): Vê apenas suas próprias horas
        params.append("user_id", user.id);
      } else if (!user.is_client && user.role === 2) {
        // Role 2 (Manager): Vê horas de todos os recursos dos seus projetos
        params.append("manager_view", "true");
        params.append("manager_id", user.id);
      } else if (!user.is_client && user.role === 1) {
        // Role 1 (Admin): Vê todas as horas
        params.append("admin_view", "true");
      } else if (user.is_client) {
        // Cliente: Vê apenas horas aprovadas dos seus projetos AMS
        params.append("client_view", "true");
        params.append("approved_only", "true");
        if (user.partner_id) {
          params.append("partner_id", user.partner_id);
        }
      }

      // Filtro por usuário (para administradores e gerentes administrativos)
      if (filterUserId && !user.is_client && (user.role === 1 || user.role === 2)) {
        params.append("user_id", filterUserId);
      }

      if (year !== undefined && month !== undefined) {
        params.append("year", String(year));
        params.append("month", String(month + 1));
      }
      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados de ticket-hours");
      }
      const rows: TicketHour[] = await response.json();
      
      // Processa os dados da API para incluir user_name e ticket_title
      const processedRows = rows.map(row => ({
        ...row,
        user_name: row.user ? `${row.user.first_name} ${row.user.last_name}` : undefined,
        ticket_title: row.ticket ? row.ticket.title : undefined,
        ticket_type_id: row.ticket ? row.ticket.type_id : undefined,
        ticket_external_id: row.ticket ? row.ticket.external_id : undefined
      }));
      
      // Agrupa apenas por appoint_date e is_approved (todos os usuários juntos por data)
      const grouped: Record<string, TimesheetRow> = {};
      processedRows.forEach((row) => {
        // Agrupar apenas por data e status de aprovação, independente do usuário
        const key = `${row.appoint_date}|${row.is_approved}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            appoint_date: row.appoint_date,
            total_minutes: 0,
            is_approved: row.is_approved,
            user_name: undefined, // Não mostrar usuário na linha principal (apenas nos filhos)
            project: row.project ?? { projectName: '', projectDesc: '' },
            children: [],
            user_id: undefined, // Não mostrar user_id na linha principal
          };
        }        
        
        // Para clientes, usar billable_minutes se disponível, senão usar minutes
        const minutesToAdd = user.is_client && row.billable_minutes 
          ? row.billable_minutes 
          : (row.minutes || 0);
        
        grouped[key].total_minutes += minutesToAdd;
        grouped[key].children!.push({
          id: row.id,
          appoint_date: row.appoint_date,
          minutes: row.minutes || 0,
          total_minutes: user.is_client && row.billable_minutes ? row.billable_minutes : row.minutes,
          is_approved: row.is_approved,
          is_deleted: row.is_deleted || false,
          user_name: user.is_client ? undefined : row.user_name, // Incluir user_name para não-clientes
          project: row.project ?? { projectName: '', projectDesc: '' },
          children: undefined,
          ticket_id: row.ticket_id,
          project_id: row.project_id,
          ticket_title: row.ticket_title, // Incluir ticket_title nos children
          ticket_type_id: row.ticket_type_id, // Incluir ticket_type_id nos children
          ticket_external_id: row.ticket_external_id, // Incluir ticket_external_id nos children
          appoint_start: user.is_client ? undefined : row.appoint_start, // Não incluir para clientes
          appoint_end: user.is_client ? undefined : row.appoint_end, // Não incluir para clientes
          user_id: user.is_client ? undefined : row.user_id, // Incluir user_id para não-clientes
        });
      });
      
      const finalData = Object.values(grouped);
      
      setData(finalData);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user, userLoading]);

  return { data, loading, fetchTicketHours };
}
