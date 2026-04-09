import { useEffect, useState } from "react";

export interface ProjectResponsible {
  id: string;
  name: string;
  email?: string;
  user_functional?: string;
  is_client?: boolean;
}

export function useProjectResponsibles(projectId?: string) {
  const [responsibles, setResponsibles] = useState<ProjectResponsible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setResponsibles([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/project-resources?project_id=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        const users = Array.isArray(data) ? data : [];
        
        console.log("useProjectResponsibles - Raw data:", users);
        
        // Filtrar apenas usuários cliente ou gerentes
        const filtered = users
          .filter((resource: any) => {
            const user = resource.user;
            if (!user) return false;
            
            // Incluir usuários cliente (is_client = true) ou gerentes (user_functional = 2)
            const isClient = user.is_client === true;
            const userFunctional = Number(resource.user_functional);
            const isManager = userFunctional === 2; // 2 = gerente/manager
            
            const shouldInclude = isClient || isManager;
            
            console.log(`Filtrando ${user.email}: isClient=${isClient}, user_functional=${resource.user_functional}, isManager=${isManager} => ${shouldInclude}`);
            
            return shouldInclude;
          })
          .map((resource: any) => ({
            id: resource.user_id,
            name: `${resource.user.first_name || ''} ${resource.user.last_name || ''}`.trim() || resource.user.email,
            email: resource.user.email,
            user_functional: resource.user_functional,
            is_client: resource.user.is_client,
          }))
          .filter(
            (responsible, index, self) =>
              index === self.findIndex((r) => r.id === responsible.id)
          ); // Remover duplicatas

        console.log("useProjectResponsibles - Filtered responsibles:", filtered);
        setResponsibles(filtered);
      })
      .catch((err) => {
        console.error("useProjectResponsibles - Error:", err);
        setError(err instanceof Error ? err.message : "Erro ao buscar responsáveis");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  return { responsibles, loading, error };
}
