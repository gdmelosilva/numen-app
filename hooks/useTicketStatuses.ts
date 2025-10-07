import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface TicketStatus {
  id: string | number;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  stage?: number;
  order: number;
  is_internal: boolean;
  group: number;
}

export function useTicketStatuses(SLA: boolean = true) {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClientComponentClient();
        
        // Construir a query base
        let query = supabase
          .from("ticket_status")
          .select("id, name, description, color, is_active, stage, order, is_internal, group")
          .eq("is_active", true) // Sempre filtrar por ativos
          .order("order", { ascending: true }); // Ordenar por ordem
        
        // Aplicar filtro de is_internal se internalOnly for true
        if (SLA) {
          query = query.not("group", "is", null) // Filtrar apenas registros com group não-nulo
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setStatuses(data || []);
      } catch (err) {
        setError((err instanceof Error ? err.message : "Erro ao buscar status dos tickets"));
        setStatuses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatuses();
  }, [SLA]); // Refetch quando internalOnly mudar

  return { statuses, loading, error };
}
