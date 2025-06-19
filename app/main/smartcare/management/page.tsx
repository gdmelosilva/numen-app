"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Ticket } from "@/types/tickets";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

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
  user_tickets?: string; // Campo especial para filtrar tickets do usuário
}

export default function TicketManagementPage() {
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [tickets, setTickets] = useState<Ticket[]>([]);  const [filters, setFilters] = useState<Filters>({
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
    user_tickets: "",
  });
  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);  const [loading, setLoading] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const buildTicketQueryParams = useCallback((customFilters: Filters) => {
    const queryParams = new URLSearchParams();
    const filterKeys = [
      'external_id', 'title', 'description', 'category_id', 'type_id',
      'module_id', 'status_id', 'priority_id', 'partner_id', 'project_id',
      'created_by', 'is_closed', 'is_private', 'created_at',
      'planned_end_date', 'actual_end_date', 'user_tickets'
    ] as const;
    
    filterKeys.forEach(key => {
      if (customFilters[key]) {
        queryParams.append(key, customFilters[key]);
      }
    });
      return queryParams;
  }, []);

  // Função para buscar projetos que o manager gerencia
  const fetchManagedProjects = useCallback(async (userId: string): Promise<string[]> => {
    try {
      // Busca projetos onde o usuário é manager ou tem role de gerenciamento
      const response = await fetch(`/api/projects?manager_id=${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data.map((project: { id: string }) => project.id) : [];
    } catch (error) {
      console.error("Erro ao buscar projetos gerenciados:", error);
      return [];
    }
  }, []);

  // Função para buscar tickets vinculados ao usuário
  const fetchUserTickets = useCallback(async (userId: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/ticket-resources?user_id=${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      // Retorna os IDs dos tickets (não external_id, mas o ID interno)
      return Array.isArray(data) ? data.map((resource: { ticket_id: string }) => resource.ticket_id) : [];
    } catch (error) {
      console.error("Erro ao buscar tickets do usuário:", error);
      return [];
    }
  }, []);

  // Função para aplicar filtros baseados no perfil do usuário
  const handleUserProfile = useCallback(async (customFilters: Filters): Promise<Filters> => {
    if (!user || !profile) return customFilters;

    const filteredQuery = { ...customFilters };

    switch (profile) {
      case 'admin-adm':
        // Admin-adm: acesso total, sem filtros automáticos
        break;
      
      case 'admin-client':
      case 'manager-client':
      case 'functional-client':
        // Cliente: apenas tickets do seu parceiro
        if (user.partner_id) {
          filteredQuery.partner_id = user.partner_id;
        }
        break;      case 'manager-adm': {
        // Manager-adm: tickets dos projetos que o usuário gerencia
        const managedProjects = await fetchManagedProjects(user.id);
        if (managedProjects.length > 0) {
          // Backend deve interpretar múltiplos project_ids separados por vírgula
          filteredQuery.project_id = managedProjects.join(',');
        }
        break;
      }case 'functional-adm': {
        // Functional-adm: tickets onde está alocado como recurso (ticket-resource)
        const userTicketIds = await fetchUserTickets(user.id);
        if (userTicketIds.length > 0) {
          // Usa parâmetro especial para filtrar por tickets do usuário
          filteredQuery.user_tickets = user.id;
        }
        break;
      }
      default:
        // Perfil não reconhecido, sem filtros especiais
        break;
    }    return filteredQuery;
  }, [user, profile, fetchUserTickets, fetchManagedProjects]);

  const fetchTickets = useCallback(async (customFilters: Filters) => {
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
  }, [buildTicketQueryParams]);
  // Aplicar filtros de perfil sempre que o usuário mudar
  useEffect(() => {
    const applyProfileFilters = async () => {
      if (user && profile && !profileLoading) {
        const profileFilters = await handleUserProfile(filters);
        if (JSON.stringify(profileFilters) !== JSON.stringify(filters)) {
          setFilters(profileFilters);
          setPendingFilters(profileFilters);
          fetchTickets(profileFilters);
        }
      }
    };

    applyProfileFilters();
  }, [user, profile, profileLoading, filters, handleUserProfile, fetchTickets]);

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
      project_id: "",      created_by: "",
      is_closed: "",
      is_private: "",
      created_at: "",
      planned_end_date: "",
      actual_end_date: "",
      user_tickets: "",
    };
    setPendingFilters(cleared);
    setFilters(cleared);
    fetchTickets(cleared);
  };
  // Função para gerar resumo dos filtros ativos
  const getActiveFiltersSummary = () => {
    const filterMap = [
      { key: 'external_id', label: 'ID' },
      { key: 'title', label: 'Título' },
      { key: 'description', label: 'Descrição' },
      { key: 'category_id', label: 'Categoria' },
      { key: 'type_id', label: 'Tipo' },
      { key: 'module_id', label: 'Módulo' },
      { key: 'status_id', label: 'Status' },
      { key: 'priority_id', label: 'Prioridade' },
      { key: 'partner_id', label: 'Parceiro' },
      { key: 'project_id', label: 'Projeto' },
      { key: 'created_by', label: 'Criado por' },
      { key: 'is_closed', label: 'Encerrado' },
      { key: 'is_private', label: 'Privado' },
      { key: 'created_at', label: 'Criado em' },
      { key: 'planned_end_date', label: 'Prev. Fim' },
      { key: 'actual_end_date', label: 'Fim Real' }
    ];
    
    const summary = filterMap
      .filter(({ key }) => pendingFilters[key as keyof Filters])
      .map(({ key, label }) => `${label}: ${pendingFilters[key as keyof Filters]}`);
    
    return summary.length ? summary.join(", ") : "Nenhum filtro ativo";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Chamados</h2>
          <p className="text-sm text-muted-foreground">Administração de Chamados</p>
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
            disabled={loading}
          >
            <Search className="mr-2 h-4 w-4" /> Buscar
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
      ) : (
        <DataTable columns={columns} data={tickets} />
      )}
    </div>
  );
}