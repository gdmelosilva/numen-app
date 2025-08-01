import { useEffect, useState } from "react";
import { AuthenticatedUser } from "@/lib/api-auth";

export interface PartnerOption {
  id: string;
  name: string;
}

export function usePartnerOptions(user?: AuthenticatedUser | null) {
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Para clientes, apenas buscar o parceiro relacionado
    if (user?.is_client && user?.partner_id) {
      fetch(`/api/options?type=partners&partnerId=${user.partner_id}`)
        .then(res => res.json())
        .then(data => {
          setPartners(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError("Erro ao buscar parceiros");
          setLoading(false);
        });
    } else if (user && (user.role === 1 || user.role === 2 || user.role === 3)) {
      // Para administrativos, gerentes e funcionais, buscar parceiros dos projetos em que estão alocados
      fetch("/api/options?type=user-allocated-partners")
        .then(res => res.json())
        .then(data => {
          setPartners(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError("Erro ao buscar parceiros");
          setLoading(false);
        });
    } else {
      // Fallback para buscar todos os parceiros (caso não tenha usuário)
      fetch("/api/options?type=partners")
        .then(res => res.json())
        .then(data => {
          setPartners(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError("Erro ao buscar parceiros");
          setLoading(false);
        });
    }
  }, [user]);

  return { partners, loading, error };
}
