"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { Contract } from "@/types/contracts";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-file";
import { ChevronDown, ChevronUp, Loader2, Search, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ContractCreateDialog } from "@/components/contract-create-dialog";
import React from "react";

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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
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
  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const partnerOptionsRef = useRef<{ id: string; name: string }[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partnersLoaded, setPartnersLoaded] = useState(false);
  const statusOptionsRef = useRef<{ id: string; name: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

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

  const fetchProjects = useCallback(async (customFilters: Filters) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = buildProjectQueryParams(customFilters);
      const response = await fetch(`/api/admin/contracts?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar projetos");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setContracts(data);
      } else {
        setContracts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza os filtros pendentes ao digitar, mas não atualiza a tabela ainda
  const handleFilterChange = (field: keyof Filters, value: string | boolean | null) => {
    setPendingFilters(prev => ({ ...prev, [field]: value }));
  };

  // Aplica os filtros pendentes e busca os projetos ao clicar em Buscar
  const handleSearch = () => {
    setFilters(pendingFilters);
    fetchProjects(pendingFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: Filters = {
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
    };
    setPendingFilters(clearedFilters);
    setFilters(clearedFilters);
    fetchProjects(clearedFilters);
  };

  const handleOpenPartnerSelect = async () => {
    if (partnersLoaded) return;
    setLoadingPartners(true);
    try {
      const res = await fetch("/api/options?type=partners");
      const data = await res.json();
      partnerOptionsRef.current = Array.isArray(data) ? data : [];
      setPartnerOptions(partnerOptionsRef.current);
      setPartnersLoaded(true);
    } catch {
      setPartnerOptions([]);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleOpenStatusSelect = async () => {
    if (statusLoaded) return;
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/options?type=project_status");
      const data = await res.json();
      statusOptionsRef.current = Array.isArray(data) ? data : [];
      setStatusOptions(statusOptionsRef.current);
      setStatusLoaded(true);
    } catch {
      setStatusOptions([]);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Função para gerar resumo dos filtros ativos
  const getActiveFiltersSummary = () => {
    const summary: string[] = [];
    if (pendingFilters.projectExtId) summary.push(`Id: ${pendingFilters.projectExtId}`);
    if (pendingFilters.projectName) summary.push(`Nome: ${pendingFilters.projectName}`);
    if (pendingFilters.projectDesc) summary.push(`Descrição: ${pendingFilters.projectDesc}`);
    if (pendingFilters.partnerId) {
      const partner = partnerOptions.find(p => p.id === pendingFilters.partnerId);
      summary.push(`Parceiro: ${partner ? partner.name : pendingFilters.partnerId}`);
    }
    if (pendingFilters.project_type) summary.push(`Tipo: ${pendingFilters.project_type}`);
    if (pendingFilters.project_status) {
      const status = statusOptions.find(s => s.id === pendingFilters.project_status);
      summary.push(`Status: ${status ? status.name : pendingFilters.project_status}`);
    }
    if (pendingFilters.is_wildcard !== null) summary.push(`Wildcard: ${pendingFilters.is_wildcard ? "Sim" : "Não"}`);
    if (pendingFilters.is_247 !== null) summary.push(`24/7: ${pendingFilters.is_247 ? "Sim" : "Não"}`);
    if (pendingFilters.start_date) summary.push(`Início: ${pendingFilters.start_date}`);
    if (pendingFilters.end_at) summary.push(`Fim: ${pendingFilters.end_at}`);
    return summary.length ? summary.join(", ") : "Nenhum filtro ativo";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Contratos</h2>
          <p className="text-sm text-muted-foreground">Administração de Contratos</p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            onClick={() => setFiltersCollapsed(v => !v)}
            aria-label={filtersCollapsed ? "Expandir filtros" : "Recolher filtros"}
          >
            {filtersCollapsed ? "Mostrar filtros" : "Recolher filtros"}
          </Button> */}
          <Button
            variant="colored2"
            onClick={handleSearch}
          >
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <ContractCreateDialog />
          <Button
            variant="colored1"
            onClick={() => exportToCSV(contracts, "projetos.csv")}
            disabled={loading || isEditDialogOpen}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Card de filtros: expandido ou resumo */}
      {filtersCollapsed ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">{getActiveFiltersSummary()}</span>
            <Button size="sm" variant="ghost" onClick={() => setFiltersCollapsed(false)}>
              <ChevronDown className="w-4 h-4 mr-2" />Editar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`filter-transition-wrapper${filtersCollapsed ? ' collapsed' : ''}`}> {/* Transition wrapper */}
          <Card>
            <CardContent className="pt-6 relative">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="projectExtId">Id.Contrato</Label>
                  <Input
                    id="projectExtId"
                    placeholder="Filtrar por Id.Contrato"
                    value={pendingFilters.projectExtId}
                    onChange={e => handleFilterChange("projectExtId", e.target.value)}
                    disabled={isEditDialogOpen}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nome do Contrato</Label>
                  <Input
                    id="projectName"
                    placeholder="Filtrar por nome do projeto"
                    value={pendingFilters.projectName}
                    onChange={e => handleFilterChange("projectName", e.target.value)}
                    disabled={isEditDialogOpen}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDesc">Descrição</Label>
                  <Input
                    id="projectDesc"
                    placeholder="Filtrar por descrição"
                    value={pendingFilters.projectDesc}
                    onChange={e => handleFilterChange("projectDesc", e.target.value)}
                    disabled={isEditDialogOpen}
                  />
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label className="mb-0">Parceiro</Label>
                  <Select
                    value={pendingFilters.partnerId || "__all__"}
                    onValueChange={value => handleFilterChange("partnerId", value === "__all__" ? "" : value)}
                    disabled={isEditDialogOpen || loadingPartners}
                    onOpenChange={open => { if (open) handleOpenPartnerSelect(); }}
                  >
                    <SelectTrigger id="partnerId" aria-labelledby="partnerId-label" disabled={isEditDialogOpen || loadingPartners} className="w-full max-w-full">
                      <SelectValue placeholder="Filtrar por parceiro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      {partnerOptions.map(partner => (
                        <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label className="mb-0">Tipo de Contrato</Label>
                  <Select
                    value={pendingFilters.project_type || "__all__"}
                    onValueChange={value => handleFilterChange("project_type", value === "__all__" ? "" : value)}
                    disabled={isEditDialogOpen}
                  >
                    <SelectTrigger id="project_type" aria-labelledby="project_type-label" disabled={isEditDialogOpen} className="w-full max-w-full">
                      <SelectValue placeholder="Filtrar por tipo de contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      <SelectItem value="AMS">AMS</SelectItem>
                      <SelectItem value="TKEY">Turnkey</SelectItem>
                      <SelectItem value="BSHOP">Bodyshop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label className="mb-0">Status do Contrato</Label>
                  <Select
                    value={pendingFilters.project_status || "__all__"}
                    onValueChange={value => handleFilterChange("project_status", value === "__all__" ? "" : value)}
                    disabled={isEditDialogOpen || loadingStatus}
                    onOpenChange={open => { if (open) handleOpenStatusSelect(); }}
                  >
                    <SelectTrigger id="project_status" aria-labelledby="project_status-label" disabled={isEditDialogOpen || loadingStatus} className="w-full max-w-full">
                      <SelectValue placeholder="Filtrar por status do contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label className="mb-0">Wildcard?</Label>
                  <Select
                    value={pendingFilters.is_wildcard === null ? "all" : pendingFilters.is_wildcard ? "true" : "false"}
                    onValueChange={value => handleFilterChange("is_wildcard", value === "all" ? null : value === "true")}
                    disabled={isEditDialogOpen}
                  >
                    <SelectTrigger id="is_wildcard" aria-labelledby="is_wildcard-label" disabled={isEditDialogOpen} className="w-full max-w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label className="mb-0">24/7?</Label>
                  <Select
                    value={pendingFilters.is_247 === null ? "all" : pendingFilters.is_247 ? "true" : "false"}
                    onValueChange={value => handleFilterChange("is_247", value === "all" ? null : value === "true")}
                    disabled={isEditDialogOpen}
                  >
                    <SelectTrigger id="is_247" aria-labelledby="is_247-label" disabled={isEditDialogOpen} className="w-full max-w-full">
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
                    value={pendingFilters.start_date}
                    onChange={e => handleFilterChange("start_date", e.target.value)}
                    disabled={isEditDialogOpen}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_at">Data Final</Label>
                  <Input
                    id="end_at"
                    type="date"
                    value={pendingFilters.end_at}
                    onChange={e => handleFilterChange("end_at", e.target.value)}
                    disabled={isEditDialogOpen}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  size={"sm"}
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loading || isEditDialogOpen}
                  aria-label="Limpar filtros"
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  <Trash className="w-4 h-4 mr-2" />Limpar filtros
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFiltersCollapsed(true)}
                  aria-label="Recolher filtros"
                  className="hover:bg-secondary/90 hover:text-black"
                >
                  <ChevronUp className="w-4 h-4 mr-2" />Recolher filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => fetchProjects(filters)} className="mt-4" disabled={isEditDialogOpen}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={contracts}
          meta={{
            onEditOpen: () => setIsEditDialogOpen(true),
            onEditClose: () => setIsEditDialogOpen(false),
          }}
        />
      )}
    </div>
  );
}