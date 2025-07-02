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
  project: {
    projectName: string;
    projectDesc: string;
  };
  children?: TimesheetRow[];
  // Campos adicionais para TicketHour
  ticket_id?: string;
  appoint_start?: string;
  appoint_end?: string;
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

      if (user.role === 3 && !user.is_client) {
        params.append("user_id", user.id);
      } else if (user.role === 2 && !user.is_client) {
        params.append("user_id", user.id);
      } else if ((user.role === 1 || user.role === 2) && user.is_client && user.partner_id) {
        try {
          const projectResponse = await fetch(`/api/smartcare/ams-projects`);
          if (projectResponse.ok) {
            const projects = await projectResponse.json();
            if (projects && projects.length > 0) {
              params.append("project_id", projects[0].id);
            } else {
              setData([]);
              setLoading(false);
              return;
            }
          } else {
            setData([]);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro ao buscar projetos AMS:", error);
          setData([]);
          setLoading(false);
          return;
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
      
      // Agrupa por appoint_date e is_approved
      const grouped: Record<string, TimesheetRow> = {};
      rows.forEach((row) => {
        const key = `${row.appoint_date}|${row.is_approved}`;
        console.log('Processando row:', row, 'Key:', key);
        
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            appoint_date: row.appoint_date,
            total_minutes: 0,
            is_approved: row.is_approved,
            project: row.project ?? { projectName: '', projectDesc: '' },
            children: [],
          };
        }        grouped[key].total_minutes += row.minutes || 0;
        grouped[key].children!.push({
          id: row.id,
          appoint_date: row.appoint_date,
          total_minutes: row.minutes,
          is_approved: row.is_approved,
          project: row.project ?? { projectName: '', projectDesc: '' },
          children: undefined,
          ticket_id: row.ticket_id,
          appoint_start: row.appoint_start,
          appoint_end: row.appoint_end,
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
