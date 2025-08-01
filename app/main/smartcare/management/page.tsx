"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Ticket } from "@/types/tickets";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, ChevronDown, ChevronUp, Trash, Download, SquareMousePointer } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { getCategoryOptions, getPriorityOptions, getModuleOptions } from "@/hooks/useOptions";
import { exportTicketsToExcel } from "@/lib/export-file";

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
  resource_user_id: string; // Novo campo para filtrar por usuário recurso
  ref_ticket_id: string; // Ticket Referência
  ref_external_id: string; // Identificação Externa
}

interface ResourceUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function TicketManagementPage() {
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resourceUsers, setResourceUsers] = useState<ResourceUser[]>([]);
  const [resourceUsersLoading, setResourceUsersLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Estados para opções dos dropdowns
  const { statuses: ticketStatuses, loading: statusesLoading } = useTicketStatuses();
  const { partners, loading: partnersLoading } = usePartnerOptions(user);
  const { projects, loading: projectsLoading } = useProjectOptions({ user });
  const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; name: string; description: string }[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Estados para dialogs
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

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
    user_tickets: "",
    resource_user_id: "",
    ref_ticket_id: "",
    ref_external_id: "",
  });
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    ...filters,
  });
  const [loading, setLoading] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Carregar opções dos dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const [categoriesData, prioritiesData, modulesData] = await Promise.all([
          getCategoryOptions(),
          getPriorityOptions(),
          getModuleOptions(),
        ]);

        setCategories(categoriesData);
        setPriorities(prioritiesData);
        setModules(modulesData);

        // Buscar tipos de ticket
        const typesResponse = await fetch('/api/options?type=ticket_types');
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setTypes(Array.isArray(typesData) ? typesData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);
  const buildTicketQueryParams = useCallback((customFilters: Filters) => {
    const queryParams = new URLSearchParams();
    const filterKeys = [
      "external_id",
      "title",
      "description",
      "category_id",
      "type_id",
      "module_id",
      "status_id",
      "priority_id",
      "partner_id",
      "project_id",
      "created_by",
      "is_closed",
      "is_private",
      "created_at",
      "planned_end_date",
      "actual_end_date",
      "user_tickets",
      "resource_user_id",
      "ref_ticket_id",
      "ref_external_id",
    ] as const;

    filterKeys.forEach((key) => {
      if (customFilters[key]) {
        queryParams.append(key, customFilters[key]);
      }
    });
    return queryParams;
  }, []);
  // Função para buscar projetos que o manager gerencia
  const fetchManagedProjects = useCallback(
    async (userId: string): Promise<string[]> => {
      try {
        // Busca na tabela project-resource onde o usuário tem função gerencial
        const response = await fetch(
          `/api/project-resources?user_id=${userId}&user_functional=manager`
        );
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data)
          ? data.map((resource: { project_id: string }) => resource.project_id)
          : [];
      } catch (error) {
        console.error("Erro ao buscar projetos gerenciados:", error);
        return [];
      }
    },
    []
  );

  // Função para aplicar filtros baseados no perfil do usuário
  const handleUserProfile = useCallback(
    async (customFilters: Filters): Promise<Filters> => {
      if (!user || !profile) return customFilters;

      const filteredQuery = { ...customFilters };

      switch (profile) {
        case "admin-adm":
          // Admin-adm: acesso total, sem filtros automáticos
          break;

        case "admin-client":
        case "manager-client":
        case "functional-client":
          // Cliente: apenas tickets do seu parceiro
          if (user.partner_id) {
            filteredQuery.partner_id = user.partner_id;
          }
          break;
        case "manager-adm": {
          // Manager-adm: tickets dos projetos que o usuário gerencia
          const managedProjects = await fetchManagedProjects(user.id);
          if (managedProjects.length > 0) {
            // Backend deve interpretar múltiplos project_ids separados por vírgula
            filteredQuery.project_id = managedProjects.join(",");
          }
          break;
        }
        case "functional-adm": {
          // Functional-adm: tickets onde está alocado como recurso (ticket-resource)
          // Sempre aplicar o filtro, mesmo se não tiver tickets alocados
          filteredQuery.user_tickets = user.id;
          break;
        }
        default:
          // Perfil não reconhecido, sem filtros especiais
          break;
      }
      return filteredQuery;
    },
    [user, profile, fetchManagedProjects]
  );

  const fetchTickets = useCallback(
    async (customFilters: Filters) => {
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
    },
    [buildTicketQueryParams]
  );
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
  }, [
    user,
    profile,
    profileLoading,
    filters,
    handleUserProfile,
    fetchTickets,
  ]);

  // Efeito para buscar usuários recursos ao carregar a página
  useEffect(() => {
    async function fetchResourceUsers() {
      setResourceUsersLoading(true);
      try {
        const res = await fetch("/api/admin/users?is_client=false");
        if (!res.ok) throw new Error("Erro ao buscar usuários");
        const users = await res.json();
        setResourceUsers(Array.isArray(users) ? users : []);
      } catch {
        setResourceUsers([]);
      } finally {
        setResourceUsersLoading(false);
      }
    }

    // Apenas admin-adm pode ver todos os usuários recursos
    if (profile === "admin-adm") {
      fetchResourceUsers();
    } else {
      // Outros perfis: usar apenas tickets do usuário
      setResourceUsersLoading(true);
      setResourceUsers([]);
      setResourceUsersLoading(false);
    }
  }, [profile]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
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
      user_tickets: "",
      resource_user_id: "",
      ref_ticket_id: "",
      ref_external_id: "",
    };
    setPendingFilters(cleared);
    setFilters(cleared);
    fetchTickets(cleared);
  };

  const handleExportToExcel = async () => {
    if (tickets.length === 0) {
      alert("Não há dados para exportar");
      return;
    }
    
    setExportLoading(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `chamados_${timestamp}`;
      await exportTicketsToExcel(tickets, filename, user?.is_client || false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };
  // Função para gerar resumo dos filtros ativos
  const getActiveFiltersSummary = () => {
    const filterMap = [
      { key: "external_id", label: "ID" },
      { key: "title", label: "Título" },
      { key: "description", label: "Descrição" },
      { key: "category_id", label: "Categoria" },
      { key: "type_id", label: "Tipo" },
      { key: "module_id", label: "Módulo" },
      { key: "status_id", label: "Status" },
      { key: "priority_id", label: "Prioridade" },
      { key: "partner_id", label: "Parceiro" },
      { key: "project_id", label: "Projeto" },
      { key: "created_by", label: "Criado por" },
      // { key: "is_closed", label: "Encerrado" },
      { key: "is_private", label: "Privado" },
      { key: "created_at", label: "Criado em" },
      { key: "planned_end_date", label: "Prev. Fim" },
      { key: "actual_end_date", label: "Fim Real" },
      { key: "user_tickets", label: "Meus Tickets" },
      { key: "resource_user_id", label: "Recurso" },
    ];

    const activeFilters = filterMap
      .filter(({ key }) => pendingFilters[key as keyof Filters])
      .map(({ key, label }) => {
        const value = pendingFilters[key as keyof Filters];
        // Truncar valores muito longos
        const displayValue = typeof value === 'string' && value.length > 20 
          ? value.substring(0, 20) + '...' 
          : value;
        return `${label}: ${displayValue}`;
      });

    if (activeFilters.length === 0) {
      return "Nenhum filtro ativo";
    }

    if (activeFilters.length <= 3) {
      return activeFilters.join(" • ");
    }

    return `${activeFilters.slice(0, 3).join(" • ")} e mais ${activeFilters.length - 3} filtro(s)`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lista de Chamados</h2>
          <p className="text-sm text-muted-foreground">
            Administração de Chamados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={loading || tickets.length === 0 || exportLoading}
            aria-label="Exportar para Excel"
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </>
            )}
          </Button>
          <Button variant="colored2" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
        </div>
      </div>
      {/* Card de filtros: expandido ou resumo */}
      {filtersCollapsed ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Filtros ativos:</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {Object.values(pendingFilters).filter(Boolean).length} filtro(s)
                  </span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {getActiveFiltersSummary()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {Object.values(pendingFilters).some(Boolean) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={loading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFiltersCollapsed(false)}
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Editar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`filter-transition-wrapper${
            filtersCollapsed ? " collapsed" : ""
          }`}
        >
          <Card>
            <CardContent className="pt-6 relative">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="external_id">ID</Label>
                  <Input
                    id="external_id"
                    placeholder="Filtrar por ID"
                    value={pendingFilters.external_id}
                    onChange={(e) =>
                      handleFilterChange("external_id", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Filtrar por título"
                    value={pendingFilters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Filtrar por descrição"
                    value={pendingFilters.description}
                    onChange={(e) =>
                      handleFilterChange("description", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoria</Label>
                  <Select
                    value={pendingFilters.category_id || "all"}
                    onValueChange={(value) => handleFilterChange("category_id", value === "all" ? "" : value)}
                    disabled={loading || optionsLoading}
                  >
                    <SelectTrigger className="w-full max-w-full">
                      <SelectValue placeholder={optionsLoading ? "Carregando..." : "Selecione uma categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type_id">Tipo</Label>
                  <Select
                    value={pendingFilters.type_id}
                    onValueChange={(value) => handleFilterChange("type_id", value === "all" ? "" : value)}
                    disabled={loading || optionsLoading}
                  >
                    <SelectTrigger className="w-full max-w-full">
                      <SelectValue placeholder={optionsLoading ? "Carregando..." : "Selecione um tipo"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module_id">Módulo</Label>
                  <Select
                    value={pendingFilters.module_id || "all"}
                    onValueChange={(value) => handleFilterChange("module_id", value === "all" ? "" : value)}
                    disabled={loading || optionsLoading}
                  >
                    <SelectTrigger className="w-full max-w-full">
                      <SelectValue placeholder={optionsLoading ? "Carregando..." : "Selecione um módulo"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os módulos</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status_id">Status</Label>
                  <Select
                    value={pendingFilters.status_id || "all"}
                    onValueChange={(value) => handleFilterChange("status_id", value === "all" ? "" : value)}
                    disabled={loading || statusesLoading}
                  >
                    <SelectTrigger className="w-full max-w-full">
                      <SelectValue placeholder={statusesLoading ? "Carregando..." : "Selecione um status"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {ticketStatuses.map((status) => (
                        <SelectItem key={status.id} value={String(status.id)}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority_id">Prioridade</Label>
                  <Select
                    value={pendingFilters.priority_id || "all"}
                    onValueChange={(value) => handleFilterChange("priority_id", value === "all" ? "" : value)}
                    disabled={loading || optionsLoading}
                  >
                    <SelectTrigger className="w-full max-w-full">
                      <SelectValue placeholder={optionsLoading ? "Carregando..." : "Selecione uma prioridade"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as prioridades</SelectItem>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.id} value={priority.id}>
                          {priority.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_id">Parceiro</Label>
                  <div className="flex gap-1">
                    <Input
                      id="partner_id"
                      placeholder="Selecione um parceiro"
                      value={pendingFilters.partner_id ? 
                        partners.find(p => p.id === pendingFilters.partner_id)?.name || pendingFilters.partner_id
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || partnersLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Parceiro</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              handleFilterChange("partner_id", "");
                              setPartnerDialogOpen(false);
                            }}
                          >
                            Todos os parceiros
                          </Button>
                          {partnersLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            partners.map((partner) => (
                              <Button
                                key={partner.id}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                  handleFilterChange("partner_id", partner.id);
                                  setPartnerDialogOpen(false);
                                }}
                              >
                                {partner.name}
                              </Button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_id">Projeto</Label>
                  <div className="flex gap-1">
                    <Input
                      id="project_id"
                      placeholder="Selecione um projeto"
                      value={pendingFilters.project_id ? 
                        projects.find(p => p.id === pendingFilters.project_id)?.name || pendingFilters.project_id
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || projectsLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Projeto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              handleFilterChange("project_id", "");
                              setProjectDialogOpen(false);
                            }}
                          >
                            Todos os projetos
                          </Button>
                          {projectsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            projects.map((project) => (
                              <Button
                                key={project.id}
                                variant="ghost"
                                className="w-full justify-start h-auto p-3"
                                onClick={() => {
                                  handleFilterChange("project_id", project.id);
                                  setProjectDialogOpen(false);
                                }}
                              >
                                <div className="text-left">
                                  <div className="font-medium">{project.projectDesc}</div>
                                  {project.name && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {project.name}
                                    </div>
                                  )}
                                </div>
                              </Button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="is_closed">Encerrado?</Label>
                  <Input
                    id="is_closed"
                    placeholder="true/false"
                    value={pendingFilters.is_closed}
                    onChange={(e) => handleFilterChange("is_closed", e.target.value)}
                    disabled={loading}
                  />
                </div> */}
                {!user?.is_client && (
                  <div className="space-y-2">
                    <Label htmlFor="is_private">Privado?</Label>
                    <Input
                      id="is_private"
                      placeholder="true/false"
                      value={pendingFilters.is_private}
                      onChange={(e) => handleFilterChange("is_private", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="created_at">Criado em</Label>
                  <Input
                    id="created_at"
                    type="date"
                    value={pendingFilters.created_at}
                    onChange={(e) => handleFilterChange("created_at", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planned_end_date">Prev. Fim</Label>
                  <Input
                    id="planned_end_date"
                    type="date"
                    value={pendingFilters.planned_end_date}
                    onChange={(e) => handleFilterChange("planned_end_date", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_end_date">Fim Real</Label>
                  <Input
                    id="actual_end_date"
                    type="date"
                    value={pendingFilters.actual_end_date}
                    onChange={(e) => handleFilterChange("actual_end_date", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref_ticket_id">Ticket Referência</Label>
                  <Input
                    id="ref_ticket_id"
                    placeholder="Filtrar por ticket referência"
                    value={pendingFilters.ref_ticket_id}
                    onChange={(e) => handleFilterChange("ref_ticket_id", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref_external_id">Identificação Externa</Label>
                  <Input
                    id="ref_external_id"
                    placeholder="Filtrar por identificação externa"
                    value={pendingFilters.ref_external_id}
                    onChange={(e) => handleFilterChange("ref_external_id", e.target.value)}
                    disabled={loading}
                  />
                </div>
                {/* Novo filtro: Recurso (Usuário vinculado) */}
                {!user?.is_client && (user?.role === 1 || user?.role === 2) && (
                  <div className="space-y-2 w-full max-w-full">
                    <Label htmlFor="resource_user_id">Recurso (Usuário vinculado)</Label>
                    <Select
                      value={pendingFilters.resource_user_id || undefined}
                      onValueChange={(value) =>
                        handleFilterChange("resource_user_id", value || "")
                      }
                      disabled={resourceUsersLoading || loading}
                    >
                      <SelectTrigger className="w-full max-w-full">
                        <SelectValue className="w-full max-w-full" placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent className="w-full max-w-full">
                        {resourceUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.first_name || ""} {u.last_name || ""} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  title="Recolher filtros para visualização compacta"
                >
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Compactar
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
        <DataTable 
          columns={getColumns(user)} 
          data={tickets} 
          showColumnVisibility={true}
        />
      )}
    </div>
  );
}