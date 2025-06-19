import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";

export interface TicketHour {
  id: string;
  appoint_date: string;
  minutes: number;
  is_approved: boolean;
}

export interface TicketHourGrouped {
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
  ids: string[];
  project?: {
    projectName: string;
    projectDesc: string;
  };
}

export interface TicketHourWithProject extends TicketHour {
  project?: {
    projectName: string;
    projectDesc: string;
  };
}

export function useTicketHoursManagement() {
  const [data, setData] = useState<TicketHourGrouped[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => {
    if (userLoading || !user) return;

    const fetchTicketHours = async () => {
      setLoading(true);
      try {
        let apiUrl = "/api/ticket-hours";
        const params = new URLSearchParams();

        // Lógica de filtragem baseada no tipo de usuário
        if (user.role === 3 && !user.is_client) {
          // Funcional Administrativo - filtrar por user_id
          params.append("user_id", user.id);        } else if (user.role === 2 && !user.is_client) {
          // Gerente Administrativo - filtrar por user_id
          params.append("user_id", user.id);
        } else if ((user.role === 1 || user.role === 2) && user.is_client && user.partner_id) {
          // Administrador Cliente ou Gerente Cliente - buscar projetos AMS do partner
          try {
            const projectResponse = await fetch(`/api/smartcare/ams-projects`);
            if (projectResponse.ok) {
              const projects = await projectResponse.json();
              if (projects && projects.length > 0) {
                // Se existir projeto AMS, filtrar por project_id do primeiro projeto AMS encontrado
                params.append("project_id", projects[0].id);
              } else {
                // Se não existir projeto AMS, retornar dados vazios
                setData([]);
                return;
              }
            } else {
              // Em caso de erro na busca de projetos, retornar dados vazios
              setData([]);
              return;
            }
          } catch (error) {
            console.error("Erro ao buscar projetos AMS:", error);
            setData([]);
            return;
          }
        }

        // Construir URL com parâmetros se existirem
        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Erro ao buscar dados de ticket-hours");
        }

        const rows: TicketHourWithProject[] = await response.json();
        
        // Agrupa por appoint_date e is_approved
        const grouped: Record<string, TicketHourGrouped> = {};
        rows.forEach((row) => {
          const key = `${row.appoint_date}|${row.is_approved}`;
          if (!grouped[key]) {
            grouped[key] = {
              appoint_date: row.appoint_date,
              total_minutes: 0,
              is_approved: row.is_approved,
              ids: [],
              project: row.project,
            };
          }
          grouped[key].total_minutes += row.minutes || 0;
          grouped[key].ids.push(row.id);
        });
        
        setData(Object.values(grouped));
      } catch (error) {
        console.error("Erro ao carregar ticket hours:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketHours();
  }, [user, userLoading]);

  return { data, loading };
}
