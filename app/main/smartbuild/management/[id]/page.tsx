"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Contract } from "@/types/contracts";
import ProjectDetailsTab from "./details";
import ProjectDashboardTab from "./dashboard";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mainTab, setMainTab] = useState("detalhes");
  const [detailsTab, setDetailsTab] = useState("tickets");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        // Primeiro, tentar obter os dados do sessionStorage
        const cachedData = sessionStorage.getItem(`project-${id}`);
        if (cachedData) {
          const projectData = JSON.parse(cachedData);
          setProject(projectData);
          setLoading(false);
          return;
        }

        // Se não encontrar no cache, fazer fetch da API
        const response = await fetch(`/api/smartbuild?id=${id}`);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        
        const { data } = await response.json();
        const projectData = Array.isArray(data) ? data[0] : data;
        
        if (!projectData) {
          setError(true);
          setLoading(false);
          return;
        }

        setProject(projectData);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar projeto:", err);
        setError(true);
        setLoading(false);
      }
    };

    loadProjectData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    notFound();
  }

  return (
    <div className="w-full mx-auto mt-8 space-y-6">
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="detalhes">
          <ProjectDetailsTab
            project={project}
            editMode={editMode}
            setEditMode={setEditMode}
            tab={detailsTab}
            setTab={setDetailsTab}
          />
        </TabsContent>
        <TabsContent value="dashboard">
          <ProjectDashboardTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
