"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import type { Ticket } from "@/types/tickets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, Trash } from "lucide-react";

interface TicketFilters {
  external_id: string;
  title: string;
  status_id: string;
  priority_id: string;
  type_id: string;
  category_id: string;
  is_closed: string;
  created_at: string;
  planned_end_date: string;
  actual_end_date: string;
}

export default function SmartbuildManagementPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: userLoading } = useCurrentUser();
  const [filters, setFilters] = useState<TicketFilters>({
    external_id: "",
    title: "",
    status_id: "",
    priority_id: "",
    type_id: "",
    category_id: "",
    is_closed: "",
    created_at: "",
    planned_end_date: "",
    actual_end_date: "",
  });
  const [pendingFilters, setPendingFilters] = useState<TicketFilters>(filters);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  // Função para buscar tickets apenas ao clicar em Buscar
  const fetchTickets = async (customFilters: TicketFilters) => {
    if (!user || userLoading) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (user.is_client) {
      // Cliente: filtra por partner_id normalmente
      if (user.partner_id) {
        params.append("partner_id", String(user.partner_id));
      }
    } else if (user.role === 1 && user.is_client === false) {
      // Admin não-cliente: não passa project_id nem faz requisição de projetos
      // Não adiciona nenhum filtro de projeto
    } else {
      // Não cliente e não admin: buscar todos os projetos do usuário
      try {
        const res = await fetch(`/api/project-resources/projects?user_id=${user.id}`);
        if (!res.ok) throw new Error("Erro ao buscar projetos do usuário");
        const projectIds: string[] = await res.json();
        if (projectIds.length === 0) {
          setTickets([]);
          setLoading(false);
          return;
        }
        // Para múltiplos project_id, buscar tickets para todos
        params.append("project_id", projectIds.join(","));
      } catch {
        setError("Erro ao buscar projetos do usuário");
        setLoading(false);
        return;
      }
    }
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    fetch(`/api/smartbuild/tickets?${params.toString()}`)
      .then(res => res.ok ? res.json() : Promise.reject("Erro ao buscar tickets"))
      .then(data => setTickets(Array.isArray(data) ? data : data?.data || []))
      .catch(err => setError(typeof err === "string" ? err : "Erro ao buscar tickets"))
      .finally(() => setLoading(false));
  };

  const handleSearch = () => {
    setFilters(pendingFilters);
    fetchTickets(pendingFilters);
  };

  const handleClearFilters = () => {
    const cleared: TicketFilters = {
      external_id: "",
      title: "",
      status_id: "",
      priority_id: "",
      type_id: "",
      category_id: "",
      is_closed: "",
      created_at: "",
      planned_end_date: "",
      actual_end_date: "",
    };
    setPendingFilters(cleared);
    setFilters(cleared);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tickets do Projeto</h2>
        <Button
          variant="colored2"
          onClick={handleSearch}
          disabled={loading}
        >
          <Search className="mr-2 h-4 w-4" /> Buscar
        </Button>
      </div>
      {filtersCollapsed ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {Object.entries(pendingFilters).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(", ") || "Nenhum filtro ativo"}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setFiltersCollapsed(false)}>
              <ChevronDown className="w-4 h-4 mr-2" />Editar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card>
            <CardContent className="pt-6 relative">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="external_id">ID</Label>
                  <Input id="external_id" placeholder="Filtrar por ID" value={pendingFilters.external_id} onChange={e => handleFilterChange("external_id", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" placeholder="Filtrar por título" value={pendingFilters.title} onChange={e => handleFilterChange("title", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status_id">Status</Label>
                  <Input id="status_id" placeholder="Filtrar por status (ID)" value={pendingFilters.status_id} onChange={e => handleFilterChange("status_id", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority_id">Prioridade</Label>
                  <Input id="priority_id" placeholder="Filtrar por prioridade (ID)" value={pendingFilters.priority_id} onChange={e => handleFilterChange("priority_id", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_id">Tipo</Label>
                  <Input id="type_id" placeholder="Filtrar por tipo (ID)" value={pendingFilters.type_id} onChange={e => handleFilterChange("type_id", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoria</Label>
                  <Input id="category_id" placeholder="Filtrar por categoria (ID)" value={pendingFilters.category_id} onChange={e => handleFilterChange("category_id", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_closed">Fechado?</Label>
                  <Input id="is_closed" placeholder="0/1" value={pendingFilters.is_closed} onChange={e => handleFilterChange("is_closed", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created_at">Criado em</Label>
                  <Input id="created_at" type="date" value={pendingFilters.created_at} onChange={e => handleFilterChange("created_at", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">Prev. Fim</Label>
                  <Input id="planned_end_date" type="date" value={pendingFilters.planned_end_date} onChange={e => handleFilterChange("planned_end_date", e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_end_date">Fim Real</Label>
                  <Input id="actual_end_date" type="date" value={pendingFilters.actual_end_date} onChange={e => handleFilterChange("actual_end_date", e.target.value)} disabled={loading} />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Button size="sm" variant="outline" onClick={handleClearFilters} disabled={loading} aria-label="Limpar filtros" className="bg-destructive hover:bg-destructive/90 text-white">
                  <Trash className="w-4 h-4 mr-2" />Limpar filtros
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFiltersCollapsed(true)} aria-label="Recolher filtros" className="hover:bg-secondary/90 hover:text-black">
                  <ChevronUp className="w-4 h-4 mr-2" />Recolher filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {loading || userLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-6 text-destructive">{error}</div>
      ) : (
        <DataTable columns={columns} data={tickets} />
      )}
    </div>
  );
}