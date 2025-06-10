"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns, Project } from "./columns";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-file";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface Filters {
  projectExtId: string;
  projectName: string;
  projectDesc: string;
  partnerId: string;
  project_type: string;
  project_status: string;
  is_wildcard: boolean | null;
  is_247: boolean | null;
  start_date: string;
  end_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    projectExtId: "",
    projectName: "",
    projectDesc: "",
    partnerId: "",
    project_type: "",
    project_status: "",
    is_wildcard: null,
    is_247: null,
    start_date: "",
    end_at: "",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const buildProjectQueryParams = (customFilters: Filters) => {
    const queryParams = new URLSearchParams();
    if (customFilters.projectExtId) queryParams.append("projectExtId", customFilters.projectExtId);
    if (customFilters.projectName) queryParams.append("projectName", customFilters.projectName);
    if (customFilters.projectDesc) queryParams.append("projectDesc", customFilters.projectDesc);
    if (customFilters.partnerId) queryParams.append("partnerId", customFilters.partnerId);
    if (customFilters.project_type) queryParams.append("project_type", customFilters.project_type);
    if (customFilters.project_status) queryParams.append("project_status", customFilters.project_status);
    if (customFilters.is_wildcard !== null && customFilters.is_wildcard !== undefined)
      queryParams.append("is_wildcard", String(customFilters.is_wildcard));
    if (customFilters.is_247 !== null && customFilters.is_247 !== undefined)
      queryParams.append("is_247", String(customFilters.is_247));
    if (customFilters.start_date) queryParams.append("start_date", customFilters.start_date);
    if (customFilters.end_at) queryParams.append("end_at", customFilters.end_at);
    return queryParams;
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = buildProjectQueryParams(filters);
      const response = await fetch(`/api/admin/projects?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar projetos");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (field: keyof Filters, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Projetos</h2>
          <p className="text-sm text-muted-foreground">Administração de Projetos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => exportToCSV(projects, "projetos.csv")}
            disabled={projects.length === 0 || isEditDialogOpen}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="projectExtId">ID Externo</Label>
              <Input
                id="projectExtId"
                placeholder="Filtrar por ID externo"
                value={filters.projectExtId}
                onChange={e => handleFilterChange("projectExtId", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                placeholder="Filtrar por nome do projeto"
                value={filters.projectName}
                onChange={e => handleFilterChange("projectName", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDesc">Descrição</Label>
              <Input
                id="projectDesc"
                placeholder="Filtrar por descrição"
                value={filters.projectDesc}
                onChange={e => handleFilterChange("projectDesc", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerId">ID do Parceiro</Label>
              <Input
                id="partnerId"
                placeholder="Filtrar por ID do parceiro"
                value={filters.partnerId}
                onChange={e => handleFilterChange("partnerId", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo de Projeto</Label>
              <Input
                id="project_type"
                placeholder="Filtrar por tipo de projeto"
                value={filters.project_type}
                onChange={e => handleFilterChange("project_type", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_status">Status do Projeto</Label>
              <Input
                id="project_status"
                placeholder="Filtrar por status do projeto"
                value={filters.project_status}
                onChange={e => handleFilterChange("project_status", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_wildcard">Wildcard?</Label>
              <Select
                value={filters.is_wildcard === null ? "all" : filters.is_wildcard ? "true" : "false"}
                onValueChange={value => handleFilterChange("is_wildcard", value === "all" ? null : value === "true")}
                disabled={isEditDialogOpen}
              >
                <SelectTrigger id="is_wildcard" disabled={isEditDialogOpen}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_247">24/7?</Label>
              <Select
                value={filters.is_247 === null ? "all" : filters.is_247 ? "true" : "false"}
                onValueChange={value => handleFilterChange("is_247", value === "all" ? null : value === "true")}
                disabled={isEditDialogOpen}
              >
                <SelectTrigger id="is_247" disabled={isEditDialogOpen}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Inicial</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={e => handleFilterChange("start_date", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_at">Data Final</Label>
              <Input
                id="end_at"
                type="date"
                value={filters.end_at}
                onChange={e => handleFilterChange("end_at", e.target.value)}
                disabled={isEditDialogOpen}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchProjects} className="mt-4" disabled={isEditDialogOpen}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          meta={{
            onEditOpen: () => setIsEditDialogOpen(true),
            onEditClose: () => setIsEditDialogOpen(false),
          }}
        />
      )}
    </div>
  );
}