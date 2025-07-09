import { useEffect, useState } from "react";

export interface TicketOption {
  id: string;
  title: string;
  description?: string;
  status_id: number;
  project_id: string;
  created_at: string;
}

export function useTicketOptions({
  projectId,
  partnerId,
  userId
}: {
  projectId?: string;
  partnerId?: string;
  userId?: string;
} = {}) {
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !userId) {
      setTickets([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Buscar tickets do projeto selecionado aos quais o usuário está vinculado
    let url = `/api/smartcare?project_id=${projectId}&user_tickets=${userId}`;
    if (partnerId) {
      url += `&partner_id=${partnerId}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao buscar tickets');
        }
        return res.json();
      })
      .then(data => {
        const ticketList = Array.isArray(data) ? data : [];
        
        // Filtrar apenas tickets que não estão cancelados (podem receber apontamentos)
        // status_id: 1=Aberto, 2=Em Andamento, 3=Fechado, 4=Cancelado
        const availableTickets = ticketList.filter((ticket: TicketOption) => 
          ticket.status_id !== 4
        );
        
        setTickets(availableTickets);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao buscar tickets disponíveis");
        setTickets([]);
        setLoading(false);
      });
  }, [projectId, partnerId, userId]);

  return { tickets, loading, error };
}
