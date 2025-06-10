"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Ticket } from "@/types/tickets";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

interface Filters {
  external_id: string;
  title: string;
  description: string;
  category_id: string;
  type_id: string;
  module_id: string;
  status_id: string;
  priority_id: string;
  partner_id: string;
  project_id: string;
  created_by: string;
  is_closed: string;
  is_private: string;
  created_at: string;
  planned_end_date: string;
  actual_end_date: string;
}

export default function TicketManagementPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<Filters>({
    external_id: "",
    title: "",
    description: "",
    category_id: "",
    type_id: "",
    module_id: "",
    status_id: "",
    priority_id: "",
    partner_id: "",
    project_id: "",
    created_by: "",
    is_closed: "",
    is_private: "",
    created_at: "",
    planned_end_date: "",
    actual_end_date: "",
  });
  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);
  const [loading, setLoading] = useState(false);

  const buildTicketQueryParams = (customFilters: Filters) => {
    const queryParams = new URLSearchParams();
    if (customFilters.external_id) queryParams.append("external_id", customFilters.external_id);
    if (customFilters.title) queryParams.append("title", customFilters.title);
    if (customFilters.description) queryParams.append("description", customFilters.description);
    if (customFilters.category_id) queryParams.append("category_id", customFilters.category_id);
    if (customFilters.type_id) queryParams.append("type_id", customFilters.type_id);
    if (customFilters.module_id) queryParams.append("module_id", customFilters.module_id);
    if (customFilters.status_id) queryParams.append("status_id", customFilters.status_id);
    if (customFilters.priority_id) queryParams.append("priority_id", customFilters.priority_id);
    if (customFilters.partner_id) queryParams.append("partner_id", customFilters.partner_id);
    if (customFilters.project_id) queryParams.append("project_id", customFilters.project_id);
    if (customFilters.created_by) queryParams.append("created_by", customFilters.created_by);
    if (customFilters.is_closed) queryParams.append("is_closed", customFilters.is_closed);
    if (customFilters.is_private) queryParams.append("is_private", customFilters.is_private);
    if (customFilters.created_at) queryParams.append("created_at", customFilters.created_at);
    if (customFilters.planned_end_date) queryParams.append("planned_end_date", customFilters.planned_end_date);
    if (customFilters.actual_end_date) queryParams.append("actual_end_date", customFilters.actual_end_date);
    return queryParams;
  };

  const fetchTickets = async (customFilters: Filters) => {
    setLoading(true);
    try {
      const queryParams = buildTicketQueryParams(customFilters);
      const response = await fetch(`/api/smartcare?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar chamados");
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setFilters(pendingFilters);
    fetchTickets(pendingFilters);
  };

  const handleClearFilters = () => {
    const cleared: Filters = {
      external_id: "",
      title: "",
      description: "",
      category_id: "",
      type_id: "",
      module_id: "",
      status_id: "",
      priority_id: "",
      partner_id: "",
      project_id: "",
      created_by: "",
      is_closed: "",
      is_private: "",
      created_at: "",
      planned_end_date: "",
      actual_end_date: "",
    };
    setPendingFilters(cleared);
    setFilters(cleared);
    fetchTickets(cleared);
  };

  // Opcional: buscar ao carregar a página
  // useEffect(() => { fetchTickets(filters); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Chamados</h2>
          <p className="text-sm text-muted-foreground">Administração de Chamados</p>
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
              <Label htmlFor="external_id">ID</Label>
              <Input
                id="external_id"
                placeholder="Filtrar por ID"
                value={pendingFilters.external_id}
                onChange={e => handleFilterChange("external_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Filtrar por título"
                value={pendingFilters.title}
                onChange={e => handleFilterChange("title", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Filtrar por descrição"
                value={pendingFilters.description}
                onChange={e => handleFilterChange("description", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Input
                id="category_id"
                placeholder="Filtrar por categoria (ID)"
                value={pendingFilters.category_id}
                onChange={e => handleFilterChange("category_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_id">Tipo</Label>
              <Input
                id="type_id"
                placeholder="Filtrar por tipo (ID)"
                value={pendingFilters.type_id}
                onChange={e => handleFilterChange("type_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module_id">Módulo</Label>
              <Input
                id="module_id"
                placeholder="Filtrar por módulo (ID)"
                value={pendingFilters.module_id}
                onChange={e => handleFilterChange("module_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_id">Status</Label>
              <Input
                id="status_id"
                placeholder="Filtrar por status (ID)"
                value={pendingFilters.status_id}
                onChange={e => handleFilterChange("status_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority_id">Prioridade</Label>
              <Input
                id="priority_id"
                placeholder="Filtrar por prioridade (ID)"
                value={pendingFilters.priority_id}
                onChange={e => handleFilterChange("priority_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_id">Parceiro</Label>
              <Input
                id="partner_id"
                placeholder="Filtrar por parceiro (ID)"
                value={pendingFilters.partner_id}
                onChange={e => handleFilterChange("partner_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_id">Projeto</Label>
              <Input
                id="project_id"
                placeholder="Filtrar por projeto (ID)"
                value={pendingFilters.project_id}
                onChange={e => handleFilterChange("project_id", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_closed">Encerrado?</Label>
              <Input
                id="is_closed"
                placeholder="true/false"
                value={pendingFilters.is_closed}
                onChange={e => handleFilterChange("is_closed", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_private">Privado?</Label>
              <Input
                id="is_private"
                placeholder="true/false"
                value={pendingFilters.is_private}
                onChange={e => handleFilterChange("is_private", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created_at">Criado em</Label>
              <Input
                id="created_at"
                type="date"
                value={pendingFilters.created_at}
                onChange={e => handleFilterChange("created_at", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planned_end_date">Prev. Fim</Label>
              <Input
                id="planned_end_date"
                type="date"
                value={pendingFilters.planned_end_date}
                onChange={e => handleFilterChange("planned_end_date", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_end_date">Fim Real</Label>
              <Input
                id="actual_end_date"
                type="date"
                value={pendingFilters.actual_end_date}
                onChange={e => handleFilterChange("actual_end_date", e.target.value)}
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
      ) : (
        <DataTable columns={columns} data={tickets} />
      )}
    </div>
  );
}