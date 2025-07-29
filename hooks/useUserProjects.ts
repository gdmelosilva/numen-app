"use client";

import { useState, useEffect } from "react";

interface Project {
  id: number | string;
  name: string;
  projectName?: string;
  projectDesc?: string;
  project_type?: string;
  partner_id?: string;
  partner?: {
    id: string;
    name: string;
  };
}

interface UseUserProjectsOptions {
  userId?: string;
  profile?: string;
  partnerId?: string;
  projectType?: string;
  enabled?: boolean;
}

export function useUserProjects({
  userId,
  profile,
  partnerId,
  projectType,
  enabled = true,
}: UseUserProjectsOptions) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !profile) return;

    const fetchUserProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url = "";
        
        // Para functional-adm: buscar projetos onde o usuário está alocado como recurso
        if (profile === "functional-adm") {
          url = `/api/project-resources?user_id=${userId}`;
        }
        // Para manager-adm: buscar projetos que o usuário gerencia
        else if (profile === "manager-adm") {
          url = `/api/project-resources?user_id=${userId}&user_functional=manager`;
        }
        // Para outros perfis administrativos com partnerId
        else if (partnerId) {
          url = `/api/admin/contracts?partnerId=${partnerId}`;
          if (projectType) {
            url += `&project_type=${projectType}`;
          }
        } else {
          // Admin-adm pode ver todos os projetos, mas precisa selecionar parceiro primeiro
          setProjects([]);
          setLoading(false);
          return;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Erro ao buscar projetos");
        }

        const data = await response.json();
        
        if (profile === "functional-adm" || profile === "manager-adm") {
          // Para functional/manager, a API retorna project-resources, precisamos buscar os projetos
          const projectIds = Array.isArray(data) 
            ? data.map((resource: { project_id: string }) => resource.project_id)
            : [];
          
          if (projectIds.length > 0) {
            // Buscar detalhes dos projetos
            const projectsResponse = await fetch(`/api/admin/contracts?ids=${projectIds.join(',')}`);
            if (projectsResponse.ok) {
              const projectsData = await projectsResponse.json();
              const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];
              // Filtrar apenas projetos AMS e mapear para o formato correto
              const amsProjects = projects
                .filter((p: { project_type?: string }) => p.project_type?.toLowerCase() === 'ams')
                .map((p: { 
                  id: string; 
                  projectName?: string; 
                  projectDesc?: string; 
                  project_type?: string;
                  partnerId?: string;
                  partner_name?: string;
                }) => ({
                  id: p.id,
                  name: p.projectName || p.projectDesc || p.id,
                  projectName: p.projectName,
                  projectDesc: p.projectDesc,
                  project_type: p.project_type,
                  partner_id: p.partnerId,
                  partner: p.partner_name ? { id: p.partnerId!, name: p.partner_name } : undefined,
                }));
              setProjects(amsProjects);
            } else {
              setProjects([]);
            }
          } else {
            setProjects([]);
          }
        } else {
          const projectsData = await response.json();
          const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];
          // Filtrar apenas projetos AMS e mapear para o formato correto
          const amsProjects = projects
            .filter((p: { project_type?: string }) => !projectType || p.project_type?.toLowerCase() === projectType.toLowerCase())
            .map((p: { 
              id: string; 
              projectName?: string; 
              projectDesc?: string; 
              project_type?: string;
              partnerId?: string;
              partner_name?: string;
            }) => ({
              id: p.id,
              name: p.projectName || p.projectDesc || p.id,
              projectName: p.projectName,
              projectDesc: p.projectDesc,
              project_type: p.project_type,
              partner_id: p.partnerId,
              partner: p.partner_name ? { id: p.partnerId!, name: p.partner_name } : undefined,
            }));
          setProjects(amsProjects);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [userId, profile, partnerId, projectType, enabled]);

  return { projects, loading, error };
}
