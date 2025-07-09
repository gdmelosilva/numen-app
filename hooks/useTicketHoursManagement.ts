import { useState, useCallback } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface TicketHour {
  id: string;
  appoint_date: string;
  minutes: number;
  is_approved: boolean;
  ticket_id?: string;
  appoint_start?: string;
  appoint_end?: string;
  user_id?: string;
  user_name?: string;
  project_id?: string;
  ticket_title?: string;
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
  user_name?: string;
  project: {
    projectName: string;
    projectDesc: string;
  };
  children?: TimesheetRow[];
  // Campos adicionais para TicketHour
  ticket_id?: string;
  project_id?: string;
  appoint_start?: string;
  appoint_end?: string;
  user_id?: string;
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

      // Filtro por usuário (apenas para administradores)
      if (filterUserId && !user.is_client && user.role === 1) {
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
      
      // Agrupa por appoint_date e is_approved (e por usuário se necessário)
      const grouped: Record<string, TimesheetRow> = {};
      processedRows.forEach((row) => {
        // Para clientes, agrupar tudo junto (unificado)
        // Para outros usuários, agrupar por data/status/usuário
        const shouldShowUser = !user.is_client && user.role === 1;
        const key = user.is_client 
          ? `${row.appoint_date}|${row.is_approved}` 
          : `${row.appoint_date}|${row.is_approved}|${row.user_id || 'unknown'}`;
        
        console.log('Processando row:', row, 'Key:', key);
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            appoint_date: row.appoint_date,
            total_minutes: 0,
            is_approved: row.is_approved,
            user_name: shouldShowUser ? row.user_name : undefined,
            project: row.project ?? { projectName: '', projectDesc: '' },
            children: [],
            user_id: shouldShowUser ? row.user_id : undefined,
          };
        }        
        grouped[key].total_minutes += row.minutes || 0;
        grouped[key].children!.push({
          id: row.id,
          appoint_date: row.appoint_date,
          total_minutes: row.minutes,
          is_approved: row.is_approved,
          user_name: row.user_name, // Sempre incluir user_name nos children
          project: row.project ?? { projectName: '', projectDesc: '' },
          children: undefined,
          ticket_id: row.ticket_id,
          project_id: row.project_id,
          ticket_title: row.ticket_title, // Incluir ticket_title nos children
          ticket_type_id: row.ticket_type_id, // Incluir ticket_type_id nos children
          ticket_external_id: row.ticket_external_id, // Incluir ticket_external_id nos children
          appoint_start: row.appoint_start,
          appoint_end: row.appoint_end,
          user_id: row.user_id, // Sempre incluir user_id nos children
        });
      });
      
      const finalData = Object.values(grouped);
      console.log('Dados agrupados finais:', finalData);
      
      setData(finalData);
    } catch (error) {
      console.error("Erro ao carregar ticket hours:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user, userLoading]);

  return { data, loading, fetchTicketHours };
}
