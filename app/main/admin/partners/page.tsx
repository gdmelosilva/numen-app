"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { columns } from "./columns";
import type { Partner } from "@/types/partners";
import { PartnerCreateDialog } from "@/components/partner-create-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMarketSegments } from "@/hooks/useOptions";
import type { MarketingInterface } from "@/types/marketing_segments";
import { export_to_xls } from "@/lib/utils";

interface Filters {
  partner_ext_id: string;
  partner_desc: string;
  partner_ident: string;
  partner_email: string;
  partner_tel: string;
  partner_mkt_sg: string;
  is_compadm: boolean | null;
  is_active: boolean | null;
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    partner_ext_id: "",
    partner_desc: "",
    partner_ident: "",
    partner_email: "",
    partner_tel: "",
    partner_mkt_sg: "",
    is_compadm: null,
    is_active: null,
  });
  const [marketSegments, setMarketSegments] = useState<MarketingInterface[]>([]);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (filters.partner_ext_id) queryParams.append("partner_ext_id", filters.partner_ext_id);
      if (filters.partner_desc) queryParams.append("partner_desc", filters.partner_desc);
      if (filters.partner_ident) queryParams.append("partner_ident", filters.partner_ident);
      if (filters.partner_email) queryParams.append("partner_email", filters.partner_email);
      if (filters.partner_tel) queryParams.append("partner_tel", filters.partner_tel);
      if (filters.partner_mkt_sg) queryParams.append("partner_mkt_sg", filters.partner_mkt_sg);
      if (typeof filters.is_compadm === "boolean") queryParams.append("is_compadm", String(filters.is_compadm));
      if (typeof filters.is_active === "boolean") queryParams.append("is_active", String(filters.is_active));
      const response = await fetch(`/api/admin/partners?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar parceiros");
      }
      const data = await response.json();
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    getMarketSegments().then((segments) => {
      if (segments) setMarketSegments(segments);
    });
  }, []);

  // Buscar só quando clicar no botão
  const handleSearch = () => {
    fetchPartners();
  };

  const handleFilterChange = (field: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (filters.partner_mkt_sg === "all") {
      setFilters((prev) => ({ ...prev, partner_mkt_sg: "" }));
    }
  }, [filters.partner_mkt_sg]);

  // Função utilitária para lidar com selects booleanos
  function getBooleanSelectValue(val: boolean | null): string {
    if (val === null) return "all";
    if (val === true) return "true";
    return "false";
  }
  function getBooleanSelectLabel(val: boolean | null): string {
    if (val === null) return "Todos";
    if (val === true) return "Sim";
    return "Não";
  }

  const handleBooleanFilterChange = (field: keyof Filters, value: string) => {
    if (value === "all") setFilters((prev) => ({ ...prev, [field]: null }));
    else setFilters((prev) => ({ ...prev, [field]: value === "true" }));
  };

  const handleExport = () => {
    export_to_xls(partners, "parceiros");
  };

  // Função para gerar resumo dos filtros ativos
  const getActiveFiltersSummary = () => {
    const summary: string[] = [];
    if (filters.partner_ext_id) summary.push(`Id: ${filters.partner_ext_id}`);
    if (filters.partner_desc) summary.push(`Nome: ${filters.partner_desc}`);
    if (filters.partner_ident) summary.push(`Identificador: ${filters.partner_ident}`);
    if (filters.partner_email) summary.push(`Email: ${filters.partner_email}`);
    if (filters.partner_tel) summary.push(`Telefone: ${filters.partner_tel}`);
    if (filters.partner_mkt_sg) {
      const seg = marketSegments.find(s => s.id.toString() === filters.partner_mkt_sg);
      summary.push(`Segmento: ${seg ? seg.name : filters.partner_mkt_sg}`);
    }
    if (filters.is_compadm !== null) summary.push(`Tipo: ${getBooleanSelectLabel(filters.is_compadm)}`);
    if (filters.is_active !== null) summary.push(`Status: ${getBooleanSelectLabel(filters.is_active)}`);
    return summary.length ? summary.join(", ") : "Nenhum filtro ativo";
  };

  const handleClearFilters = () => {
    setFilters({
      partner_ext_id: "",
      partner_desc: "",
      partner_ident: "",
      partner_email: "",
      partner_tel: "",
      partner_mkt_sg: "",
      is_compadm: null,
      is_active: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Parceiros</h2>
          <p className="text-sm text-muted-foreground">
            Administração de Parceiros
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            onClick={() => setFiltersCollapsed(v => !v)}
            aria-label={filtersCollapsed ? "Expandir filtros" : "Recolher filtros"}
          >
            {filtersCollapsed ? "Mostrar filtros" : "Recolher filtros"}
          </Button> */}
          <Button variant="colored2" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <PartnerCreateDialog onSuccess={fetchPartners} />
          <Button onClick={handleExport} variant="colored1">
            Exportar para Excel
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
                  <Label htmlFor="partner_desc">Nome</Label>
                  <Input
                    id="partner_desc"
                    placeholder="Filtrar por Nome"
                    value={filters.partner_desc}
                    onChange={(e) => handleFilterChange("partner_desc", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_email">Email</Label>
                  <Input
                    id="partner_email"
                    placeholder="Filtrar por Email"
                    value={filters.partner_email}
                    onChange={(e) => handleFilterChange("partner_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_ext_id">Id.Parceiro</Label>
                  <Input
                    id="partner_ext_id"
                    placeholder="Filtrar por Id.Parceiro"
                    value={filters.partner_ext_id}
                    onChange={(e) => handleFilterChange("partner_ext_id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_ident">Identificador</Label>
                  <Input
                    id="partner_ident"
                    placeholder="Filtrar por Identificador"
                    value={filters.partner_ident}
                    onChange={(e) => handleFilterChange("partner_ident", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_tel">Telefone</Label>
                  <Input
                    id="partner_tel"
                    placeholder="Filtrar por Telefone"
                    value={filters.partner_tel}
                    onChange={(e) => handleFilterChange("partner_tel", e.target.value)}
                  />
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label htmlFor="partner_mkt_sg">Segmento</Label>
                  <Select
                    value={filters.partner_mkt_sg}
                    onValueChange={(value) => handleFilterChange("partner_mkt_sg", value)}
                  >
                    <SelectTrigger className="h-9 w-full max-w-full">
                      <SelectValue>
                        {filters.partner_mkt_sg
                          ? marketSegments.find(s => s.id.toString() === filters.partner_mkt_sg)?.name || "Filtrar por Segmento"
                          : "Filtrar por Segmento"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {marketSegments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id.toString()}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label htmlFor="is_compadm">Tipo</Label>
                  <Select
                    value={getBooleanSelectValue(filters.is_compadm)}
                    onValueChange={(value) => handleBooleanFilterChange("is_compadm", value)}
                  >
                    <SelectTrigger className="h-9 w-full max-w-full">
                      <SelectValue>{getBooleanSelectLabel(filters.is_compadm)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Administrativo</SelectItem>
                      <SelectItem value="false">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full max-w-full">
                  <Label htmlFor="is_active">Status</Label>
                  <Select
                    value={getBooleanSelectValue(filters.is_active)}
                    onValueChange={(value) => handleBooleanFilterChange("is_active", value)}
                  >
                    <SelectTrigger className="h-9 w-full max-w-full">
                      <SelectValue>{getBooleanSelectLabel(filters.is_active)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  size={"sm"}
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loading}
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
            <Button onClick={fetchPartners} className="mt-4">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} data={partners} />
      )}
    </div>
  );
}