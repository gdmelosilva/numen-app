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
  project?: {
    projectName: string;
    projectDesc: string;
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
  appoint_start?: string;
  appoint_end?: string;
  user_id?: string;
}

export function useTicketHoursManagement() {
  const [data, setData] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: userLoading } = useCurrentUser();

  const fetchTicketHours = useCallback(async (year?: number, month?: number) => {
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
      
      console.log('Dados brutos da API:', rows);
      console.log('URL da API:', apiUrl);
      
      // Agrupa por appoint_date e is_approved (e por usuário se necessário)
      const grouped: Record<string, TimesheetRow> = {};
      rows.forEach((row) => {
        // Para clientes, agrupar tudo junto (unificado)
        // Para outros usuários, agrupar por data/status/usuário
        const shouldShowUser = !user.is_client && (user.role === 1 || user.role === 2);
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
          user_name: shouldShowUser ? row.user_name : undefined,
          project: row.project ?? { projectName: '', projectDesc: '' },
          children: undefined,
          ticket_id: row.ticket_id,
          appoint_start: row.appoint_start,
          appoint_end: row.appoint_end,
          user_id: shouldShowUser ? row.user_id : undefined,
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
