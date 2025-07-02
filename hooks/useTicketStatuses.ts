import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface TicketStatus {
  id: string | number;
  name: string;
}

export function useTicketStatuses() {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from("ticket_status")
          .select("id, name");
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
  }, []);

  return { statuses, loading, error };
}
