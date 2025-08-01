import { useEffect, useState } from "react";
import { AuthenticatedUser } from "@/lib/api-auth";

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
  userPartnerId,
  user
}: {
  partnerId?: string;
  projectId?: string;
  profile?: string;
  userPartnerId?: string;
  user?: AuthenticatedUser | null;
} = {}) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    let url = "/api/admin/contracts";
    
    // Para clientes, buscar apenas projetos do parceiro do cliente
    if (user?.is_client && user?.partner_id) {
      url += `?partnerId=${user.partner_id}`;
    } else if (user && (user.role === 1 || user.role === 2 || user.role === 3)) {
      // Para administrativos, gerentes e funcionais, buscar apenas projetos em que estão alocados
      url = "/api/options?type=user-allocated-projects";
    } else if (partnerId) {
      // Fallback para buscar projetos do parceiro selecionado
      url += `?partnerId=${partnerId}`;
    }
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let filtered = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        
        // Mapeia para garantir que name sempre seja projectName
        filtered = filtered.map((p: ProjectOption) => ({
          ...p,
          name: p.projectName || p.name || p.projectDesc || p.id,
        }));
        
        // Filtrar apenas projetos AMS
        filtered = filtered.filter((p: ProjectOption) => (p.project_type?.toLowerCase?.() === 'ams'));
        
        // Aplicar filtros legacy para compatibilidade
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
  }, [partnerId, projectId, profile, userPartnerId, user]);

  return { projects, loading, error };
}
