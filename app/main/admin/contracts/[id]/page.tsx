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
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    console.log("[ProjectDetailPage] id param:", id);
    const loadContractData = async () => {
      try {
        // Primeiro, tentar obter os dados do sessionStorage
        const cachedData = sessionStorage.getItem(`contract-${id}`);
        if (cachedData) {
          const contractData = JSON.parse(cachedData);
          console.log("[ProjectDetailPage] Dados do sessionStorage:", contractData);
          setProject(contractData);
          setLoading(false);
          return;
        }

        // Se não encontrar no cache, fazer fetch da API
        const response = await fetch(`/api/admin/contracts?id=${id}`);
        console.log("[ProjectDetailPage] Response status:", response.status);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        
        const { data } = await response.json();
        console.log("[ProjectDetailPage] Dados retornados da API:", data);
        const contractData = Array.isArray(data) ? data[0] : data;

        if (!contractData) {
          setError(true);
          setLoading(false);
          return;
        }

        setProject(contractData);
        // Salva no sessionStorage para navegação rápida futura
        sessionStorage.setItem(`contract-${id}`, JSON.stringify(contractData));
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar contrato:", err);
        setError(true);
        setLoading(false);
      }
    };

    // Sempre tenta pegar do sessionStorage primeiro
    const cachedData = sessionStorage.getItem(`contract-${id}`);
    if (cachedData) {
      console.log("[ProjectDetailPage] Dados do sessionStorage (fora do async):", JSON.parse(cachedData));
      setProject(JSON.parse(cachedData));
      setLoading(false);
    } else {
      loadContractData();
    }
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
        </TabsContent>
        <TabsContent value="dashboard">
          <ProjectDashboardTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
