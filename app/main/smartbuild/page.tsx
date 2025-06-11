"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Contract } from "@/types/contracts";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

interface Filters {
  projectExtId: string;
  projectName: string;
  projectDesc: string;
  partnerId: string;
  project_type: string;
  project_status: string;
  is_wildcard: string;
  is_247: string;
  start_date: string;
  end_at: string;
}

export default function TicketManagementPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filters, setFilters] = useState<Filters>({
    projectExtId: "",
    projectName: "",
    projectDesc: "",
    partnerId: "",
    project_type: "",
    project_status: "",
    is_wildcard: "",
    is_247: "",
    start_date: "",
    end_at: "",
  });  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);
  const [loading, setLoading] = useState(false);

  const buildProjectQueryParams = (customFilters: Filters) => {
    const queryParams = new URLSearchParams();
    if (customFilters.projectExtId) queryParams.append("projectExtId", customFilters.projectExtId);
    if (customFilters.projectName) queryParams.append("projectName", customFilters.projectName);
    if (customFilters.projectDesc) queryParams.append("projectDesc", customFilters.projectDesc);
    if (customFilters.partnerId) queryParams.append("partnerId", customFilters.partnerId);
    if (customFilters.project_type) queryParams.append("project_type", customFilters.project_type);
    if (customFilters.project_status) queryParams.append("project_status", customFilters.project_status);
    if (customFilters.is_wildcard) queryParams.append("is_wildcard", customFilters.is_wildcard);
    if (customFilters.is_247) queryParams.append("is_247", customFilters.is_247);
    if (customFilters.start_date) queryParams.append("start_date", customFilters.start_date);
    if (customFilters.end_at) queryParams.append("end_at", customFilters.end_at);
    return queryParams;
  };

  const fetchContracts = async (customFilters: Filters) => {
    setLoading(true);
    try {
      const queryParams = buildProjectQueryParams(customFilters);
      const response = await fetch(`/api/smartbuild?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar contratos");
      const data = await response.json();
      setContracts(data.data);
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setFilters(pendingFilters);
    fetchContracts(pendingFilters);
  };

  const handleClearFilters = () => {
    const cleared: Filters = {
      projectExtId: "",
      projectName: "",
      projectDesc: "",
      partnerId: "",
      project_type: "",
      project_status: "",
      is_wildcard: "",
      is_247: "",
      start_date: "",
      end_at: "",
    };
    setPendingFilters(cleared);
    setFilters(cleared);
    fetchContracts(cleared);
  };

  // Opcional: buscar ao carregar a página
  // useEffect(() => { fetchTickets(filters); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Projetos</h2>
          <p className="text-sm text-muted-foreground">Administração de Projetos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="colored2"
            onClick={handleSearch}
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={loading}
          >
            Limpar filtros
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="projectExtId">ID</Label>
              <Input
                id="projectExtId"
                placeholder="Filtrar por ID"
                value={pendingFilters.projectExtId}
                onChange={e => handleFilterChange("projectExtId", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Título</Label>
              <Input
                id="projectName"
                placeholder="Filtrar por título"
                value={pendingFilters.projectName}
                onChange={e => handleFilterChange("projectName", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDesc">Descrição</Label>
              <Input
                id="projectDesc"
                placeholder="Filtrar por descrição"
                value={pendingFilters.projectDesc}
                onChange={e => handleFilterChange("projectDesc", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerId">Parceiro</Label>
              <Input
                id="partnerId"
                placeholder="Filtrar por parceiro (ID)"
                value={pendingFilters.partnerId}
                onChange={e => handleFilterChange("partnerId", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo</Label>
              <Input
                id="project_type"
                placeholder="Filtrar por tipo (ID)"
                value={pendingFilters.project_type}
                onChange={e => handleFilterChange("project_type", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_status">Status</Label>
              <Input
                id="project_status"
                placeholder="Filtrar por status (ID)"
                value={pendingFilters.project_status}
                onChange={e => handleFilterChange("project_status", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_wildcard">Wildcard?</Label>
              <Input
                id="is_wildcard"
                placeholder="true/false"
                value={pendingFilters.is_wildcard}
                onChange={e => handleFilterChange("is_wildcard", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_247">24/7?</Label>
              <Input
                id="is_247"
                placeholder="true/false"
                value={pendingFilters.is_247}
                onChange={e => handleFilterChange("is_247", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Início</Label>
              <Input
                id="start_date"
                type="date"
                value={pendingFilters.start_date}
                onChange={e => handleFilterChange("start_date", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_at">Fim</Label>
              <Input
                id="end_at"
                type="date"
                value={pendingFilters.end_at}
                onChange={e => handleFilterChange("end_at", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (        <DataTable
          columns={columns}
          data={contracts}
        />
      )}
    </div>
  );
}