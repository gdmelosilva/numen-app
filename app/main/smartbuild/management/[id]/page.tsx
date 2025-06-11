"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import type { Contract } from "@/types/contracts";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-2xl font-bold mb-2">Detalhes do Projeto</h2>          <div><strong>ID:</strong> {project.id}</div>
          <div><strong>Nome:</strong> {project.projectName || '-'}</div>
          <div><strong>Descrição:</strong> {project.projectDesc || '-'}</div>
          <div><strong>Parceiro:</strong> {project.partner?.partner_desc || '-'}</div>
          <div><strong>Início:</strong> {project.start_date ? format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</div>
          <div><strong>Fim:</strong> {project.end_at ? format(new Date(project.end_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}</div>
          <div><strong>Tipo:</strong> {project.project_type || '-'}</div>
          <div><strong>Status:</strong> {project.project_status?.name || '-'}</div>
          <div><strong>Wildcard?</strong> {project.is_wildcard ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
          <div><strong>24/7?</strong> {project.is_247 ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}</div>
        </CardContent>
      </Card>
    </div>
  );
}
