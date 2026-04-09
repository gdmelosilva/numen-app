import { useEffect, useState } from "react";

export interface PartnerClient {
  id: string;
  name: string;
  email?: string;
}

export function usePartnerClients(partnerId?: string) {
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) {
      console.log("usePartnerClients - partnerId vazio, limpando clientes");
      setClients([]);
      return;
    }

    console.log("usePartnerClients - Fetching clientes para partnerId:", partnerId);
    setLoading(true);
    setError(null);

    const url = `/api/partner-clients?partner_id=${partnerId}`;
    console.log("usePartnerClients - URL:", url);

    fetch(url)
      .then((res) => {
        console.log("usePartnerClients - Response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("usePartnerClients - Raw data:", data);
        
        const users = Array.isArray(data) ? data : data?.data ? data.data : [];
        console.log("usePartnerClients - Parsed users:", users);
        
        const formatted = users
          .map((user: any) => ({
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            email: user.email,
          }))
          .filter(
            (client: PartnerClient, index: number, self: PartnerClient[]) =>
              index === self.findIndex((c) => c.id === client.id)
          );

        console.log("usePartnerClients - Formatted clients:", formatted);
        setClients(formatted);
      })
      .catch((err) => {
        console.error("usePartnerClients - Error:", err);
        setError(err instanceof Error ? err.message : "Erro ao buscar clientes");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [partnerId]);

  return { clients, loading, error };
}
