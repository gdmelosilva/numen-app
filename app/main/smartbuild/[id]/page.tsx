"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Contract as AMSContract } from "@/types/contracts";
import ProjectDetailsTab from "./details";
import ProjectDashboardTab from "./dashboard";
import ProjectUsersTab from "./users/ProjectUsersTab";
import ProjectTicketsTab from "./tickets/ProjectTicketsTab";

export default function ProjectsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<AMSContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mainTab, setMainTab] = useState("detalhes");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const response = await fetch(`/api/smartbuild?details=true&project_id=${id}`);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const data = await response.json();
        let projectData;
        if (Array.isArray(data)) {
          projectData = data[0];
        } else if (Array.isArray(data.data)) {
          projectData = data.data[0];
        } else {
          projectData = data.data ?? data;
        }
        if (!projectData) {
          setError(true);
          setLoading(false);
          return;
        }
        setProject(projectData);
        setLoading(false);
      } catch {
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
          />
          {/* Tabs secundárias para Usuários e Chamados */}
          <div className="mt-8">
            <Tabs defaultValue="usuarios" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                <TabsTrigger value="chamados">Atividades</TabsTrigger>
              </TabsList>
              <TabsContent value="usuarios">
                <ProjectUsersTab projectId={String(project.id)} />
              </TabsContent>              <TabsContent value="chamados">
                <ProjectTicketsTab 
                  projectId={String(project.id)} 
                  partnerId={String(project.partnerId)}
                  project={project}
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        <TabsContent value="dashboard">
          <ProjectDashboardTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}