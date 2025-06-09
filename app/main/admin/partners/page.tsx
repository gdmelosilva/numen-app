"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { columns, Partner } from "./columns";

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
  const [searchInput, setSearchInput] = useState("");

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
    fetchPartners();
  }, [fetchPartners]);

  const handleSearch = () => {
    setFilters((prev) => {
      const newFilters = { ...prev, search: searchInput };
      fetchPartnersWithFilters(newFilters);
      return newFilters;
    });
  };

  const fetchPartnersWithFilters = async (customFilters: Filters) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (customFilters.partner_ext_id) queryParams.append("partner_ext_id", customFilters.partner_ext_id);
      if (customFilters.partner_desc) queryParams.append("partner_desc", customFilters.partner_desc);
      if (customFilters.partner_ident) queryParams.append("partner_ident", customFilters.partner_ident);
      if (customFilters.partner_email) queryParams.append("partner_email", customFilters.partner_email);
      if (customFilters.partner_tel) queryParams.append("partner_tel", customFilters.partner_tel);
      if (customFilters.partner_mkt_sg) queryParams.append("partner_mkt_sg", customFilters.partner_mkt_sg);
      if (typeof customFilters.is_compadm === "boolean") queryParams.append("is_compadm", String(customFilters.is_compadm));
      if (typeof customFilters.is_active === "boolean") queryParams.append("is_active", String(customFilters.is_active));
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
  };

  const handleFilterChange = (field: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
          <Button variant="secondary" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome, email, ID externo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_email">Email</Label>
              <Input
                id="partner_email"
                placeholder="Filtrar por email"
                value={filters.partner_email}
                onChange={(e) => handleFilterChange("partner_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_ext_id">ID Externo</Label>
              <Input
                id="partner_ext_id"
                placeholder="Filtrar por ID externo"
                value={filters.partner_ext_id}
                onChange={(e) => handleFilterChange("partner_ext_id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_desc">Descrição</Label>
              <Input
                id="partner_desc"
                placeholder="Filtrar por descrição"
                value={filters.partner_desc}
                onChange={(e) => handleFilterChange("partner_desc", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_ident">Identificador</Label>
              <Input
                id="partner_ident"
                placeholder="Filtrar por identificador"
                value={filters.partner_ident}
                onChange={(e) => handleFilterChange("partner_ident", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_tel">Telefone</Label>
              <Input
                id="partner_tel"
                placeholder="Filtrar por telefone"
                value={filters.partner_tel}
                onChange={(e) => handleFilterChange("partner_tel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_mkt_sg">Sigla MKT</Label>
              <Input
                id="partner_mkt_sg"
                placeholder="Filtrar por sigla MKT"
                value={filters.partner_mkt_sg}
                onChange={(e) => handleFilterChange("partner_mkt_sg", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_compadm">Comp. Adm?</Label>
              <select
                id="is_compadm"
                className="w-full border rounded px-2 py-1"
                value={filters.is_compadm ? "true" : "false"}
                onChange={(e) => handleFilterChange("is_compadm", e.target.value === "true")}
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">Ativo?</Label>
              <select
                id="is_active"
                className="w-full border rounded px-2 py-1"
                value={filters.is_active ? "true" : "false"}
                onChange={(e) => handleFilterChange("is_active", e.target.value === "true")}
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
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