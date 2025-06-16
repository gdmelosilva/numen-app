import { useEffect, useState } from "react";

export interface ProjectOption {
  id: string;
  name: string;
  partner_id: string;
  projectName?: string;
  projectDesc?: string;
  project_type?: string;
}

export function useProjectOptions({
  partnerId,
  projectId,
  profile,
  userPartnerId
}: {
  partnerId?: string;
  projectId?: string;
  profile?: string;
  userPartnerId?: string;
} = {}) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Monta a query string para buscar projetos do parceiro selecionado
    let url = "/api/admin/contracts";
    if (partnerId) {
      url += `?partnerId=${partnerId}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let filtered = Array.isArray(data?.data) ? data.data : [];
        // Mapeia para garantir que name sempre seja projectName
        filtered = filtered.map((p: ProjectOption) => ({
          ...p,
          name: p.projectName || p.name || p.projectDesc || p.id,
        }));
        if (profile === 'manager-adm' && userPartnerId) {
          filtered = filtered.filter((p: { partner_id: string; }) => p.partner_id === userPartnerId);
        } else if ((profile === 'functional-adm' || profile === 'functional-client') && projectId) {
          filtered = filtered.filter((p: { id: string; }) => p.id === projectId);
        }
        setProjects(filtered);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao buscar projetos");
        setLoading(false);
      });
  }, [partnerId, projectId, profile, userPartnerId]);

  return { projects, loading, error };
}
