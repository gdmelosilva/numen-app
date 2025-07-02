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
    
    console.log('Buscando tickets com URL:', url);

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao buscar tickets');
        }
        return res.json();
      })
      .then(data => {
        console.log('Dados recebidos da API smartcare:', data);
        
        // A API retorna um array diretamente, não um objeto com propriedade data
        const ticketList = Array.isArray(data) ? data : [];
        console.log('Lista de tickets:', ticketList);
        
        // Filtrar apenas tickets que não estão cancelados (podem receber apontamentos)
        // status_id: 1=Aberto, 2=Em Andamento, 3=Fechado, 4=Cancelado
        const availableTickets = ticketList.filter((ticket: TicketOption) => 
          ticket.status_id !== 4
        );
        console.log('Tickets disponíveis após filtro:', availableTickets);
        
        setTickets(availableTickets);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar tickets:', err);
        setError("Erro ao buscar tickets disponíveis");
        setTickets([]);
        setLoading(false);
      });
  }, [projectId, partnerId, userId]);

  return { tickets, loading, error };
}
