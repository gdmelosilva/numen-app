import { useEffect, useState } from "react";

export interface PartnerOption {
  id: string;
  name: string;
}

export function usePartnerOptions() {
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
  }, []);

  return { partners, loading, error };
}
