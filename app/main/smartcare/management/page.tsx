"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import type { Ticket } from "@/types/tickets";
import { getColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Search, ChevronDown, ChevronUp, Trash, Download, SquareMousePointer, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LinkResourceDialog } from "@/components/LinkResourceDialog";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { getCategoryOptions, getPriorityOptions, getModuleOptions } from "@/hooks/useOptions";
import { exportTicketsToExcel } from "@/lib/export-file";
import type { VisibilityState } from "@tanstack/react-table";

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
  ref_external_id: string; // Identificação Externaaa
}

interface ResourceUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function TicketManagementPage() {
  const router = useRouter();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resourceUsers, setResourceUsers] = useState<ResourceUser[]>([]);
  const [resourceUsersLoading, setResourceUsersLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [userProjectIds, setUserProjectIds] = useState<string[]>([]);

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
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);

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

  // Estados para o dialog de vinculação de recursos
  const [linkResourceDialogOpen, setLinkResourceDialogOpen] = useState(false);
  const [selectedTicketForLinking, setSelectedTicketForLinking] = useState<Ticket | null>(null);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estado para controlar visibilidade das colunas
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Função para salvar filtros no sessionStorage
  const saveFiltersToSession = useCallback((filtersToSave: Filters) => {
    try {
      sessionStorage.setItem('smartcare-filters', JSON.stringify(filtersToSave));
    } catch {
      // Silent error - filtros não são críticos
    }
  }, []);

  // Função para carregar filtros do sessionStorage
  const loadFiltersFromSession = useCallback((): Filters | null => {
    try {
      const savedFilters = sessionStorage.getItem('smartcare-filters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
    } catch {
      // Silent error - filtros não são críticos  
    }
    return null;
  }, []);

  // Função para salvar/carregar pageSize do sessionStorage
  const savePageSizeToSession = useCallback((size: number) => {
    try {
      sessionStorage.setItem('smartcare-page-size', size.toString());
    } catch {
      // Silent error - pageSize não é crítico
    }
  }, []);

  const loadPageSizeFromSession = useCallback((): number => {
    try {
      const savedPageSize = sessionStorage.getItem('smartcare-page-size');
      if (savedPageSize) {
        const size = parseInt(savedPageSize, 10);
        return [10, 25, 50, 100].includes(size) ? size : 10;
      }
    } catch {
      // Silent error - pageSize não é crítico
    }
    return 10;
  }, []);

  // Função para salvar/carregar visibilidade das colunas do sessionStorage
  const saveColumnVisibilityToSession = useCallback((visibility: VisibilityState) => {
    try {
      sessionStorage.setItem('smartcare-column-visibility', JSON.stringify(visibility));
    } catch {
      // Silent error - visibilidade das colunas não é crítica
    }
  }, []);

  const loadColumnVisibilityFromSession = useCallback((): VisibilityState => {
    try {
      const savedVisibility = sessionStorage.getItem('smartcare-column-visibility');
      if (savedVisibility) {
        return JSON.parse(savedVisibility);
      }
    } catch {
      // Silent error - visibilidade das colunas não é crítica
    }
    return {};
  }, []);

  // Efeito para definir automaticamente o parceiro do cliente
  useEffect(() => {
    if (user?.is_client && user?.partner_id && !pendingFilters.partner_id) {
      const partnerId = user.partner_id.toString();
      setPendingFilters(prev => ({ ...prev, partner_id: partnerId }));
      setFilters(prev => ({ ...prev, partner_id: partnerId }));
    }
  }, [user?.is_client, user?.partner_id, pendingFilters.partner_id]);

  // Efeito para carregar filtros salvos na inicialização
  useEffect(() => {
    const savedFilters = loadFiltersFromSession();
    if (savedFilters) {
      setFilters(savedFilters);
      setPendingFilters(savedFilters);
    }
    
    // Carregar pageSize salvo
    const savedPageSize = loadPageSizeFromSession();
    setPageSize(savedPageSize);
    
    // Carregar visibilidade das colunas salva
    const savedColumnVisibility = loadColumnVisibilityFromSession();
    setColumnVisibility(savedColumnVisibility);
    
    // Carregar estado dos filtros colapsados
    try {
      const savedCollapsed = sessionStorage.getItem('smartcare-filters-collapsed');
      if (savedCollapsed !== null) {
        setFiltersCollapsed(JSON.parse(savedCollapsed));
      }
    } catch {
      // Silent error - filtros não são críticos
    }
  }, [loadFiltersFromSession, loadPageSizeFromSession, loadColumnVisibilityFromSession]);

  // Efeito para limpar filtros quando o usuário faz logout
  useEffect(() => {
    if (!user && !profileLoading) {
      // Usuário fez logout, limpar filtros salvos
      try {
        sessionStorage.removeItem('smartcare-filters');
        sessionStorage.removeItem('smartcare-filters-collapsed');
      } catch {
        // Silent error - filtros não são críticos
      }
    }
  }, [user, profileLoading]);

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
      } catch {
        // Silent error - opções carregarão posteriormente
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);
  const buildTicketQueryParams = useCallback((customFilters: Filters, page: number = 1, limit: number = 10) => {
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

    // Adicionar parâmetros de paginação
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    return queryParams;
  }, []);

  // Função para buscar todos os projetos aos quais o usuário está vinculado
  const fetchUserProjects = useCallback(
    async (userId: string): Promise<string[]> => {
      try {
        // Busca na tabela project-resource onde o usuário está vinculado
        const response = await fetch(
          `/api/project-resources?user_id=${userId}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data)
          ? data.map((resource: { project_id: string }) => resource.project_id)
          : [];
      } catch {
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
          // Manager-adm: sem filtros automáticos de projeto
          // O usuário pode selecionar manualmente os projetos que gerencia
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
    [user, profile]
  );

  const fetchTickets = useCallback(
    async (customFilters: Filters, page: number = 1, limit: number = 10) => {
      setLoading(true);
      try {
        const queryParams = buildTicketQueryParams(customFilters, page, limit);
        const url = `/api/smartcare?${queryParams.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar chamados");
        
        const data = await response.json();
        
        // Verificar se a API retorna dados paginados ou array simples
        if (data && typeof data === 'object' && 'data' in data) {
          // Resposta paginada da API
          setTickets(data.data || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit));
          setCurrentPage(page);
        } else if (Array.isArray(data)) {
          // Resposta simples (array direto) - implementar paginação do lado cliente
          const totalItems = data.length;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedData = data.slice(startIndex, endIndex);
          
          setTickets(paginatedData);
          setTotalCount(totalItems);
          setTotalPages(Math.ceil(totalItems / limit));
          setCurrentPage(page);
        } else {
          // Fallback
          setTickets([]);
          setTotalCount(0);
          setTotalPages(0);
          setCurrentPage(1);
        }
      } catch {
        setTickets([]);
        setTotalCount(0);
        setTotalPages(0);
        setCurrentPage(1);
      } finally {
        setLoading(false);
      }
    },
    [buildTicketQueryParams]
  );

  useEffect(() => {
    const applyProfileFilters = async () => {
      if (user && profile && !profileLoading) {
        const currentFilters = loadFiltersFromSession() || filters;
        const profileFilters = await handleUserProfile(currentFilters);
        const hasFiltersToApply = Object.values(currentFilters).some(value => value !== "");
        
        if (JSON.stringify(profileFilters) !== JSON.stringify(currentFilters)) {
          setFilters(profileFilters);
          setPendingFilters(profileFilters);
          saveFiltersToSession(profileFilters);
          fetchTickets(profileFilters, 1, pageSize);
        } else if (JSON.stringify(currentFilters) !== JSON.stringify(filters)) {
          setFilters(currentFilters);
          setPendingFilters(currentFilters);
          fetchTickets(currentFilters, 1, pageSize);
        } else if (hasFiltersToApply && tickets.length === 0) {
          fetchTickets(profileFilters, 1, pageSize);
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
    loadFiltersFromSession,
    saveFiltersToSession,
    tickets.length,
    pageSize,
  ]);

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

    if (profile === "admin-adm") {
      fetchResourceUsers();
    } else {
      setResourceUsersLoading(true);
      setResourceUsers([]);
      setResourceUsersLoading(false);
    }
  }, [profile]);

  // Efeito para carregar projetos vinculados ao usuário administrativo
  useEffect(() => {
    async function loadUserProjects() {
      if (user && !user.is_client && user.id && profile && profile !== "admin-adm") {
        try {
          const projectIds = await fetchUserProjects(user.id);
          setUserProjectIds(projectIds);
        } catch {
          setUserProjectIds([]);
        }
      } else {
        setUserProjectIds([]);
      }
    }

    loadUserProjects();
  }, [user, profile, fetchUserProjects]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setFilters(pendingFilters);
    saveFiltersToSession(pendingFilters);
    setCurrentPage(1); 
    fetchTickets(pendingFilters, 1, pageSize);
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
    saveFiltersToSession(cleared);
    setCurrentPage(1); 
    fetchTickets(cleared, 1, pageSize);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleExportCurrentPageToExcel = async () => {
    if (tickets.length === 0) {
      alert("Não há dados para exportar");
      return;
    }
    
    setExportLoading(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `chamados_pagina_${currentPage}_${timestamp}`;
      await exportTicketsToExcel(tickets, filename, user?.is_client || false);
      setExportPopoverOpen(false);
    } catch {
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportAllToExcel = async () => {
    setExportLoading(true);
    try {
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
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `/api/smartcare?${queryParams.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar chamados para exportação");
      
      const allTickets: Ticket[] = await response.json();

      if (!Array.isArray(allTickets) || allTickets.length === 0) {
        alert("Não há dados para exportar com os filtros aplicados");
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `chamados_todos_${timestamp}`;
      await exportTicketsToExcel(allTickets, filename, user?.is_client || false);
      setExportPopoverOpen(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

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
        
        let displayValue = value;
        
        switch (key) {
          case "partner_id":
            const partner = partners.find(p => p.id === value);
            displayValue = partner?.name || value;
            break;
          case "project_id":
            const project = projects.find(p => p.id === value);
            displayValue = project?.projectDesc || project?.name || value;
            break;
          case "category_id":
            const category = categories.find(c => c.id === value);
            displayValue = category?.name || value;
            break;
          case "type_id":
            const type = types.find(t => t.id === value);
            displayValue = type?.name || value;
            break;
          case "module_id":
            const moduleItem = modules.find(m => m.id === value);
            displayValue = moduleItem?.name || value;
            break;
          case "status_id":
            const status = ticketStatuses.find(s => String(s.id) === value);
            displayValue = status?.name || value;
            break;
          case "priority_id":
            const priority = priorities.find(p => p.id === value);
            displayValue = priority?.name || value;
            break;
          case "resource_user_id":
            const user = resourceUsers.find(u => u.id === value);
            displayValue = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : value;
            break;
          default:
            displayValue = value;
        }
        
        const finalDisplayValue = typeof displayValue === 'string' && displayValue.length > 20 
          ? displayValue.substring(0, 20) + '...' 
          : displayValue;
        
        return `${label}: ${finalDisplayValue}`;
      });

    if (activeFilters.length === 0) {
      return "Nenhum filtro ativo";
    }

    if (activeFilters.length <= 3) {
      return activeFilters.join(" • ");
    }

    return `${activeFilters.slice(0, 3).join(" • ")} e mais ${activeFilters.length - 3} filtro(s)`;
  };

  const getFilteredResources = () => {
    if (!resourceSearchTerm.trim()) {
      return resourceUsers;
    }
    
    const searchLower = resourceSearchTerm.toLowerCase().trim();
    return resourceUsers.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  };

  const getFilteredPartners = () => {
    let filteredPartners = partners;
    
    // Para usuários clientes, mostrar apenas seu próprio parceiro
    if (user?.is_client && user?.partner_id) {
      filteredPartners = partners.filter(partner => partner.id === user.partner_id);
    }
    
    // Aplicar filtro de busca por texto
    if (!partnerSearchTerm.trim()) {
      return filteredPartners;
    }
    
    const searchLower = partnerSearchTerm.toLowerCase().trim();
    return filteredPartners.filter(partner => {
      const name = (partner.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  };

  const getFilteredProjects = () => {
    let filteredProjects = projects;
    
    // Para usuários clientes, filtrar apenas projetos do seu parceiro
    if (user?.is_client && user?.partner_id) {
      filteredProjects = projects.filter(project => project.partner_id === user.partner_id);
    }
    // Para usuários administrativos que NÃO são admin-adm, filtrar apenas projetos aos quais estão vinculados
    else if (user && !user.is_client && profile && profile !== "admin-adm") {
      if (userProjectIds.length > 0) {
        filteredProjects = projects.filter(project => userProjectIds.includes(project.id));
      } else {
        // Se não tem projetos vinculados, não mostrar nenhum projeto
        filteredProjects = [];
      }
    }
    // Para admin-adm, mostrar todos os projetos sem filtro
    // Para usuários não clientes, se tiver parceiro selecionado, filtrar projetos desse parceiro
    else if (pendingFilters.partner_id) {
      filteredProjects = projects.filter(project => project.partner_id === pendingFilters.partner_id);
    }
    
    // Aplicar filtro de busca por texto
    if (!projectSearchTerm.trim()) {
      return filteredProjects;
    }
    
    const searchLower = projectSearchTerm.toLowerCase().trim();
    return filteredProjects.filter(project => {
      const projectDesc = (project.projectDesc || '').toLowerCase();
      const name = (project.name || '').toLowerCase();
      return projectDesc.includes(searchLower) || name.includes(searchLower);
    });
  };

  const handleRowClick = (ticket: Ticket) => {
    const ticketId = ticket.external_id || ticket.id;
    if (ticketId) {
      router.push(`/main/smartcare/management/${ticketId}`);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    savePageSizeToSession(newPageSize);
    fetchTickets(filters, 1, newPageSize);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchTickets(filters, newPage, pageSize);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleColumnVisibilityChange = useCallback((newVisibility: VisibilityState) => {
    setColumnVisibility(newVisibility);
    saveColumnVisibilityToSession(newVisibility);
  }, [saveColumnVisibilityToSession]);

  const handleLinkResource = useCallback((ticket: Ticket) => {
    setSelectedTicketForLinking(ticket);
    setLinkResourceDialogOpen(true);
  }, []);

  const handleLinkResourceSuccess = useCallback(() => {
    // Recarregar a lista de tickets para refletir as mudanças
    fetchTickets(filters, currentPage, pageSize);
  }, [fetchTickets, filters, currentPage, pageSize]);

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
          <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={loading || totalCount === 0 || exportLoading}
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
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium leading-none mb-2">Opções de Exportação</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha como deseja exportar os dados
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={handleExportCurrentPageToExcel}
                    disabled={exportLoading}
                  >
                    <div className="text-left">
                      <div className="font-medium">Página Atual</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Exportar {tickets.length} registros da página
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={handleExportAllToExcel}
                    disabled={exportLoading}
                  >
                    <div className="text-left">
                      <div className="font-medium">Todos os Registros</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Exportar {totalCount} Registros Filtrados
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="colored2" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
        </div>
      </div>
      {/* Card de filtros: expandido ou resumo */}
      {filtersCollapsed ? (
        <Card className="shadow-sm border-gray-200 border-[1px]">
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
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFiltersCollapsed(false);
                    try {
                      sessionStorage.setItem('smartcare-filters-collapsed', 'false');
                    } catch {
                      // Silent error - filtros não são críticos
                    }
                  }}
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
          <Card className="shadow-sm border-gray-200 border-[1px]">
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                {/* <div className="space-y-2">
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
                </div> */}
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
                      placeholder={user?.is_client ? "Seu parceiro" : "Selecione um parceiro"}
                      value={
                        // Para usuários clientes, mostrar sempre seu parceiro
                        user?.is_client && user?.partner_id
                          ? partners.find(p => p.id === user.partner_id)?.name || "Carregando..."
                          : pendingFilters.partner_id 
                            ? partners.find(p => p.id === pendingFilters.partner_id)?.name || pendingFilters.partner_id
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
                          disabled={loading || partnersLoading || (user?.is_client && !!user?.partner_id)}
                          title={user?.is_client && !!user?.partner_id ? "Clientes não podem alterar o parceiro" : "Selecionar parceiro"}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {user?.is_client ? "Seu Parceiro" : "Selecionar Parceiro"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          {!user?.is_client && (
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"  />
                              <Input
                                placeholder="Buscar parceiro..."
                                value={partnerSearchTerm}
                                onChange={(e) => setPartnerSearchTerm(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                          )}
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {!user?.is_client && (
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  handleFilterChange("partner_id", "");
                                  setPartnerDialogOpen(false);
                                  setPartnerSearchTerm("");
                                }}
                              >
                                Todos os parceiros
                              </Button>
                            )}
                            {partnersLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredPartners().map((partner) => (
                                <Button
                                  key={partner.id}
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    handleFilterChange("partner_id", partner.id);
                                    setPartnerDialogOpen(false);
                                    setPartnerSearchTerm("");
                                  }}
                                >
                                  {partner.name}
                                </Button>
                              ))
                            )}
                            {!partnersLoading && getFilteredPartners().length === 0 && partnerSearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhum parceiro encontrado
                              </div>
                            )}
                          </div>
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
                          <DialogTitle>
                            {user?.is_client ? "Projetos do Seu Parceiro" : "Selecionar Projeto"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"  />
                            <Input
                              placeholder="Buscar projeto..."
                              value={projectSearchTerm}
                              onChange={(e) => setProjectSearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                handleFilterChange("project_id", "");
                                setProjectDialogOpen(false);
                                setProjectSearchTerm("");
                              }}
                            >
                              {user?.is_client ? "Todos os seus projetos" : "Todos os projetos"}
                            </Button>
                            {projectsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredProjects().map((project) => (
                                <Button
                                  key={project.id}
                                  variant="ghost"
                                  className="w-full justify-start h-auto p-3"
                                  onClick={() => {
                                    handleFilterChange("project_id", project.id);
                                    setProjectDialogOpen(false);
                                    setProjectSearchTerm("");
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
                            {!projectsLoading && getFilteredProjects().length === 0 && projectSearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhum projeto encontrado
                              </div>
                            )}
                          </div>
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
                      onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                </div>
                {/* Novo filtro: Recurso (Usuário vinculado) */}
                {!user?.is_client && (user?.role === 1 || user?.role === 2) && (
                  <div className="space-y-2">
                    <Label htmlFor="resource_user_id">Recurso (Usuário vinculado)</Label>
                    <div className="flex gap-1">
                      <Input
                        id="resource_user_id"
                        placeholder="Selecione um recurso"
                        value={pendingFilters.resource_user_id ? 
                          resourceUsers.find(u => u.id === pendingFilters.resource_user_id)?.first_name 
                            ? `${resourceUsers.find(u => u.id === pendingFilters.resource_user_id)?.first_name} ${resourceUsers.find(u => u.id === pendingFilters.resource_user_id)?.last_name}` 
                            : pendingFilters.resource_user_id
                          : ""
                        }
                        disabled={true}
                        className="cursor-pointer"
                      />
                      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            disabled={loading || resourceUsersLoading}
                          >
                            <SquareMousePointer className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Selecionar Recurso</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                              placeholder="Buscar por nome ou email..."
                              value={resourceSearchTerm}
                              onChange={(e) => setResourceSearchTerm(e.target.value)}
                              className="pl-8"
                              />
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  handleFilterChange("resource_user_id", "");
                                  setResourceDialogOpen(false);
                                  setResourceSearchTerm("");
                                }}
                              >
                                Todos os recursos
                              </Button>
                              {resourceUsersLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                getFilteredResources().map((user) => (
                                  <Button
                                    key={user.id}
                                    variant="ghost"
                                    className="w-full justify-start h-auto p-3"
                                    onClick={() => {
                                      handleFilterChange("resource_user_id", user.id);
                                      setResourceDialogOpen(false);
                                      setResourceSearchTerm("");
                                    }}
                                  >
                                    <div className="text-left">
                                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                                      {user.email && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {user.email}
                                        </div>
                                      )}
                                    </div>
                                  </Button>
                                ))
                              )}
                              {!resourceUsersLoading && getFilteredResources().length === 0 && resourceSearchTerm && (
                                <div className="text-center text-muted-foreground py-4">
                                  Nenhum recurso encontrado
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
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
                  onClick={() => {
                    setFiltersCollapsed(true);
                    try {
                      sessionStorage.setItem('smartcare-filters-collapsed', 'true');
                    } catch {
                      // Silent error - filtros não são críticos
                    }
                  }}
                  aria-label="Recolher filtros"
                  className="hover:bg-primary/90 hover:text-white"
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
      
      {/* Interface de Paginação */}
      <div className="flex items-center justify-between py-4 border-b">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Tickets por página:
          </Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(parseInt(value, 10))}
            disabled={loading}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} tickets
              </>
            ) : (
              "Nenhum ticket encontrado"
            )}
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={loading || currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm">Página</span>
              <span className="font-medium">{currentPage}</span>
              <span className="text-sm">de</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={loading || currentPage >= totalPages}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={getColumns(user, handleLinkResource)} 
          data={tickets} 
          onRowClick={handleRowClick}
          showColumnVisibility={true}
          showPagination={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          columnLabels={{
            'is_private': 'Privado?',
            'external_id': 'Id Chamado',
            'ref_external_id': 'Ref. Externa',
            'project': 'Projeto',
            'partner': 'Parceiro',
            'category': 'Categoria',
            'title': 'Título',
            'module': 'Módulo Func.',
            'status': 'Status',
            'created_at': 'Criado em',
            'priority': 'Prioridade',
            'planned_end_date': 'Prev. Fim',
            'main_resource': 'Recurso Principal',
            'other_resources': 'Demais Recursos',
          }}
        />
      )}

      {/* Dialog para vincular recurso */}
      <LinkResourceDialog
        open={linkResourceDialogOpen}
        onOpenChange={setLinkResourceDialogOpen}
        ticket={selectedTicketForLinking}
        onSuccess={handleLinkResourceSuccess}
      />
    </div>
  );
}