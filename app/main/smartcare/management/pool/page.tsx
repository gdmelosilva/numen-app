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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Search, ChevronDown, ChevronUp, Trash, Download, SquareMousePointer, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LinkResourceDialog } from "@/components/LinkResourceDialog";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { usePartnerOptions } from "@/hooks/usePartnerOptions";
import { useProjectOptions } from "@/hooks/useProjectOptions";
import { TicketQuickViewDialog } from "@/components/TicketQuickViewDialog";
import { getCategoryOptions, getPriorityOptions, getModuleOptions } from "@/hooks/useOptions";
import { exportTicketsToExcel } from "@/lib/export-file";
import type { VisibilityState } from "@tanstack/react-table";
import { toast } from "sonner";

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
  // is_private?: string; // Adicionado para corresponder ao filterKeys
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

interface CreatedByUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function AmsPoolPage() {
  const router = useRouter();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resourceUsers, setResourceUsers] = useState<ResourceUser[]>([]);
  const [resourceUsersLoading, setResourceUsersLoading] = useState(false);
  const [createdByUsers, setCreatedByUsers] = useState<CreatedByUser[]>([]);
  const [createdByUsersLoading, setCreatedByUsersLoading] = useState(false);
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
  const [createdByDialogOpen, setCreatedByDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [selectedStatusIds, setSelectedStatusIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [selectedPriorityIds, setSelectedPriorityIds] = useState<string[]>([]);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [createdBySearchTerm, setCreatedBySearchTerm] = useState("");
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [moduleSearchTerm, setModuleSearchTerm] = useState("");
  const [prioritySearchTerm, setPrioritySearchTerm] = useState("");
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
  // Confirmação de auto-vínculo (Vincular-se)
  const [confirmLinkOpen, setConfirmLinkOpen] = useState(false);
  const [linkingSelf, setLinkingSelf] = useState(false);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estado para controlar visibilidade das colunas
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Dialog de visualização rápida do ticket
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewTicket, setQuickViewTicket] = useState<Ticket | null>(null);

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
    // Configuração padrão: coluna "Abrir" oculta por padrão
    return { open_ticket: false };
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
      // "is_private",
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
          // Functional-adm: o backend já aplica automaticamente o filtro de segurança
          // para mostrar apenas tickets onde o usuário está alocado como recurso.
          // Não aplicamos nenhum filtro adicional no frontend, apenas preservamos
          // os filtros manuais que o usuário escolheu (parceiro, projeto, etc.)
          
          // Não fazer nada aqui - deixar que o backend controle a segurança
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
        // partnerId é obrigatório para a API /api/tickets
        const partnerId =
          customFilters.partner_id ||
          // Usar o parceiro associado ao usuário (independente de ser cliente ou não)
          (user?.partner_id ? String(user.partner_id) : "");

        if (!partnerId) {
          // Sem parceiro definido, não busca nada
          setTickets([]);
          setTotalCount(0);
          setTotalPages(0);
          setCurrentPage(1);
          return;
        }

        const res = await fetch(
          `/api/tickets?partnerId=${encodeURIComponent(partnerId)}`
        );
        if (!res.ok) throw new Error("Erro ao buscar tickets do parceiro (status 1)");

        const payload = await res.json();
        const fullList: Ticket[] = Array.isArray(payload)
          ? payload
          : (payload.tickets ?? payload.data ?? []);

        // Paginação no cliente (API não pagina)
        const totalItems = fullList.length;
        const start = (page - 1) * limit;
        const end = start + limit;

        setTickets(fullList.slice(start, end));
        setTotalCount(totalItems);
        setTotalPages(Math.ceil(totalItems / limit));
        setCurrentPage(page);
      } catch {
        setTickets([]);
        setTotalCount(0);
        setTotalPages(0);
        setCurrentPage(1);
      } finally {
        setLoading(false);
      }
    },
    [user] // depende do usuário (para pegar partner_id)
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

  // Efeito para carregar usuários que criaram tickets
  useEffect(() => {
    async function fetchCreatedByUsers() {
      setCreatedByUsersLoading(true);
      try {
        // Criar filtros básicos sem os filtros de pesquisa específicos
        const baseFilters = await handleUserProfile({
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
          created_at: "",
          planned_end_date: "",
          actual_end_date: "",
          user_tickets: "",
          resource_user_id: "",
          ref_ticket_id: "",
          ref_external_id: "",
        });
        
        // Buscar tickets que o usuário atual pode ver
        const queryParams = buildTicketQueryParams(baseFilters, 1, 1000);
        const res = await fetch(`/api/smartcare?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Erro ao buscar tickets para filtrar usuários");
        
        const ticketsData = await res.json();
        const visibleTickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.data || []);
        
        console.log('Tickets visíveis:', visibleTickets.length);
        console.log('Primeiro ticket exemplo:', visibleTickets[0]);
        
        // Extrair usuários únicos que criaram tickets usando os dados que já vêm da API
        const createdByUsersMap = new Map();
        
        visibleTickets.forEach((ticket: { created_by_user?: { id: string; first_name?: string; last_name?: string; email?: string } }) => {
          const createdByUser = ticket.created_by_user;
          if (createdByUser && createdByUser.id) {
            createdByUsersMap.set(createdByUser.id, {
              id: createdByUser.id,
              first_name: createdByUser.first_name,
              last_name: createdByUser.last_name,
              email: createdByUser.email,
            });
          }
        });
        
        const uniqueCreatedByUsers = Array.from(createdByUsersMap.values());
        console.log('Usuários únicos que criaram tickets:', uniqueCreatedByUsers);
        
        setCreatedByUsers(uniqueCreatedByUsers);
      } catch (error) {
        console.error('Erro ao buscar usuários que criaram tickets:', error);
        setCreatedByUsers([]);
      } finally {
        setCreatedByUsersLoading(false);
      }
    }

    // Só buscar se o usuário estiver logado e os filtros estiverem carregados
    if (user && profile && !profileLoading) {
      fetchCreatedByUsers();
    }
  }, [user, profile, profileLoading, handleUserProfile, buildTicketQueryParams]);

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

  // Sincronizar status selecionados com o filtro atual
  useEffect(() => {
    if (pendingFilters.status_id) {
      const statusIds = pendingFilters.status_id.split(',').filter(Boolean);
      setSelectedStatusIds(statusIds);
    } else {
      setSelectedStatusIds([]);
    }
  }, [pendingFilters.status_id]);

  // Sincronizar categorias selecionadas com o filtro atual
  useEffect(() => {
    if (pendingFilters.category_id) {
      const categoryIds = pendingFilters.category_id.split(',').filter(Boolean);
      setSelectedCategoryIds(categoryIds);
    } else {
      setSelectedCategoryIds([]);
    }
  }, [pendingFilters.category_id]);

  // Sincronizar módulos selecionados com o filtro atual
  useEffect(() => {
    if (pendingFilters.module_id) {
      const moduleIds = pendingFilters.module_id.split(',').filter(Boolean);
      setSelectedModuleIds(moduleIds);
    } else {
      setSelectedModuleIds([]);
    }
  }, [pendingFilters.module_id]);

  // Sincronizar prioridades selecionadas com o filtro atual
  useEffect(() => {
    if (pendingFilters.priority_id) {
      const priorityIds = pendingFilters.priority_id.split(',').filter(Boolean);
      setSelectedPriorityIds(priorityIds);
    } else {
      setSelectedPriorityIds([]);
    }
  }, [pendingFilters.priority_id]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleStatusToggle = (statusId: string) => {
    const updatedStatusIds = selectedStatusIds.includes(statusId)
      ? selectedStatusIds.filter(id => id !== statusId)
      : [...selectedStatusIds, statusId];
    
    setSelectedStatusIds(updatedStatusIds);
    
    // Atualizar o filtro com os status selecionados
    const statusFilter = updatedStatusIds.length > 0 ? updatedStatusIds.join(',') : '';
    handleFilterChange('status_id', statusFilter);
  };

  const handleSelectAllStatuses = () => {
    const allStatusIds = ticketStatuses.map(status => String(status.id));
    setSelectedStatusIds(allStatusIds);
    handleFilterChange('status_id', allStatusIds.join(','));
  };

  const handleClearAllStatuses = () => {
    setSelectedStatusIds([]);
    handleFilterChange('status_id', '');
  };

  // Funções para categoria
  const handleCategoryToggle = (categoryId: string) => {
    const updatedCategoryIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    setSelectedCategoryIds(updatedCategoryIds);
    
    const categoryFilter = updatedCategoryIds.length > 0 ? updatedCategoryIds.join(',') : '';
    handleFilterChange('category_id', categoryFilter);
  };

  const handleSelectAllCategories = () => {
    const allCategoryIds = categories.map(category => String(category.id));
    setSelectedCategoryIds(allCategoryIds);
    handleFilterChange('category_id', allCategoryIds.join(','));
  };

  const handleClearAllCategories = () => {
    setSelectedCategoryIds([]);
    handleFilterChange('category_id', '');
  };

  // Funções para módulo
  const handleModuleToggle = (moduleId: string) => {
    const updatedModuleIds = selectedModuleIds.includes(moduleId)
      ? selectedModuleIds.filter(id => id !== moduleId)
      : [...selectedModuleIds, moduleId];
    
    setSelectedModuleIds(updatedModuleIds);
    
    const moduleFilter = updatedModuleIds.length > 0 ? updatedModuleIds.join(',') : '';
    handleFilterChange('module_id', moduleFilter);
  };

  const handleSelectAllModules = () => {
    const allModuleIds = modules.map(module => String(module.id));
    setSelectedModuleIds(allModuleIds);
    handleFilterChange('module_id', allModuleIds.join(','));
  };

  const handleClearAllModules = () => {
    setSelectedModuleIds([]);
    handleFilterChange('module_id', '');
  };

  // Funções para prioridade
  const handlePriorityToggle = (priorityId: string) => {
    const updatedPriorityIds = selectedPriorityIds.includes(priorityId)
      ? selectedPriorityIds.filter(id => id !== priorityId)
      : [...selectedPriorityIds, priorityId];
    
    setSelectedPriorityIds(updatedPriorityIds);
    
    const priorityFilter = updatedPriorityIds.length > 0 ? updatedPriorityIds.join(',') : '';
    handleFilterChange('priority_id', priorityFilter);
  };

  const handleSelectAllPriorities = () => {
    const allPriorityIds = priorities.map(priority => String(priority.id));
    setSelectedPriorityIds(allPriorityIds);
    handleFilterChange('priority_id', allPriorityIds.join(','));
  };

  const handleClearAllPriorities = () => {
    setSelectedPriorityIds([]);
    handleFilterChange('priority_id', '');
  };

  const handleSearch = () => {
    setFilters(pendingFilters);
    saveFiltersToSession(pendingFilters);
    setCurrentPage(1); 
    fetchTickets(pendingFilters, 1, pageSize);
  };

  const handleClearFilters = async () => {
    // Criar filtros básicos vazios
    const clearedFilters: Filters = {
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
      created_at: "",
      planned_end_date: "",
      actual_end_date: "",
      user_tickets: "",
      resource_user_id: "",
      ref_ticket_id: "",
      ref_external_id: "",
    };

    // Aplicar filtros automáticos baseados no perfil (preservar filtros de segurança)
    const filtersWithProfile = await handleUserProfile(clearedFilters);
    
    setPendingFilters(filtersWithProfile);
    setFilters(filtersWithProfile);
    saveFiltersToSession(filtersWithProfile);
    setCurrentPage(1); 
    fetchTickets(filtersWithProfile, 1, pageSize);
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
      // { key: "is_private", label: "Privado" },
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
            if (value && value.includes(',')) {
              // Múltiplas categorias selecionadas
              const categoryIds = value.split(',').filter(Boolean);
              const categoryNames = categoryIds
                .map(id => categories.find(c => String(c.id) === id)?.name)
                .filter(Boolean);
              displayValue = categoryNames.length > 0 
                ? categoryNames.length === 1 
                  ? categoryNames[0] 
                  : `${categoryNames.length} categorias`
                : value;
            } else if (value) {
              // Categoria única
              const category = categories.find(c => String(c.id) === value);
              displayValue = category?.name || value;
            } else {
              displayValue = value || "";
            }
            break;
          case "type_id":
            const type = types.find(t => t.id === value);
            displayValue = type?.name || value;
            break;
          case "module_id":
            if (value && value.includes(',')) {
              // Múltiplos módulos selecionados
              const moduleIds = value.split(',').filter(Boolean);
              const moduleNames = moduleIds
                .map(id => modules.find(m => String(m.id) === id)?.name)
                .filter(Boolean);
              displayValue = moduleNames.length > 0 
                ? moduleNames.length === 1 
                  ? moduleNames[0] 
                  : `${moduleNames.length} módulos`
                : value;
            } else if (value) {
              // Módulo único
              const moduleItem = modules.find(m => String(m.id) === value);
              displayValue = moduleItem?.name || value;
            } else {
              displayValue = value || "";
            }
            break;
          case "status_id":
            if (value && value.includes(',')) {
              // Múltiplos status selecionados
              const statusIds = value.split(',').filter(Boolean);
              const statusNames = statusIds
                .map(id => ticketStatuses.find(s => String(s.id) === id)?.name)
                .filter(Boolean);
              displayValue = statusNames.length > 0 
                ? statusNames.length === 1 
                  ? statusNames[0] 
                  : `${statusNames.length} status`
                : value;
            } else {
              // Status único
              const status = ticketStatuses.find(s => String(s.id) === value);
              displayValue = status?.name || value;
            }
            break;
          case "priority_id":
            if (value && value.includes(',')) {
              // Múltiplas prioridades selecionadas
              const priorityIds = value.split(',').filter(Boolean);
              const priorityNames = priorityIds
                .map(id => priorities.find(p => String(p.id) === id)?.name)
                .filter(Boolean);
              displayValue = priorityNames.length > 0 
                ? priorityNames.length === 1 
                  ? priorityNames[0] 
                  : `${priorityNames.length} prioridades`
                : value;
            } else if (value) {
              // Prioridade única
              const priority = priorities.find(p => String(p.id) === value);
              displayValue = priority?.name || value;
            } else {
              displayValue = value || "";
            }
            break;
          case "resource_user_id":
            const user = resourceUsers.find(u => u.id === value);
            displayValue = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : value;
            break;
          case "created_by":
            const createdByUser = createdByUsers.find(u => u.id === value);
            displayValue = createdByUser ? `${createdByUser.first_name || ''} ${createdByUser.last_name || ''}`.trim() || createdByUser.email : value;
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

  const getFilteredCreatedByUsers = () => {
    if (!createdBySearchTerm.trim()) {
      return createdByUsers;
    }
    
    const searchLower = createdBySearchTerm.toLowerCase().trim();
    return createdByUsers.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  };

  const getFilteredStatuses = () => {
    if (!statusSearchTerm.trim()) {
      return ticketStatuses;
    }
    
    const searchLower = statusSearchTerm.toLowerCase().trim();
    return ticketStatuses.filter(status => {
      const name = (status.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  };

  const getFilteredCategories = () => {
    if (!categorySearchTerm.trim()) {
      return categories;
    }
    
    const searchLower = categorySearchTerm.toLowerCase().trim();
    return categories.filter(category => {
      const name = (category.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  };

  const getFilteredModules = () => {
    if (!moduleSearchTerm.trim()) {
      return modules;
    }
    
    const searchLower = moduleSearchTerm.toLowerCase().trim();
    return modules.filter(module => {
      const name = (module.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  };

  const getFilteredPriorities = () => {
    if (!prioritySearchTerm.trim()) {
      return priorities;
    }
    
    const searchLower = prioritySearchTerm.toLowerCase().trim();
    return priorities.filter(priority => {
      const name = (priority.name || '').toLowerCase();
      return name.includes(searchLower);
    });
  };

  const handleRowClick = (ticket: Ticket) => {
    // Abrir o dialog de visualização rápida em vez de navegar
    setQuickViewTicket(ticket);
    setQuickViewOpen(true);
  };

  // Abrir o dialog de vínculo a partir do QuickView
  const handleLinkSelfFromQuickView = useCallback((ticket: Ticket) => {
    setSelectedTicketForLinking(ticket);
    setConfirmLinkOpen(true);
  }, []);

  const handleConfirmLinkSelf = useCallback(async () => {
    if (!selectedTicketForLinking || !user?.id) return;
    const t = selectedTicketForLinking;
    const userId = user.id;
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Você';

    const linkingToast = toast.loading(`Vinculando ${userName} ao chamado ${t.external_id || t.id}...`);
    setLinkingSelf(true);
    try {
      // 1) Vincular usuário ao ticket
      await fetch("/api/ticket-resources/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: t.id, user_id: userId }),
      });

      // 2) Definir como responsável principal
      await fetch("/api/ticket-resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ticket_id: t.id, is_main: true }),
      });

      // 3) Atualizar status para "Em Atendimento" (3) se estava 1
      if (t.status_id === 1) {
        await fetch("/api/tickets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket_id: t.id, status_id: "3" }),
        });
      }

      // 4) Atualizar lista
      await fetchTickets(filters, currentPage, pageSize);

      // 5) Notificação por e-mail (não bloqueante)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ticket_id: t.id,
          ticket_external_id: t.external_id,
          ticket_title: t.title,
          ticket_description: t.description,
          project_name: t.project?.projectName || 'Projeto não informado',
          partner_name: t.partner?.partner_desc || 'Parceiro não informado',
          email: user.email,
          name: userName,
          assigned_by: userName,
        }),
      }).catch(() => {/* opcional: silenciar erro de email */});

      toast.success("Vinculado com sucesso!", { id: linkingToast });
      // Fechar diálogos e navegar para a página de detalhes
      setConfirmLinkOpen(false);
      setQuickViewOpen(false);
      setQuickViewTicket(null);
      const targetId = (t as unknown as { external_id?: string | number }).external_id ?? t.id;
      if (targetId) {
        router.push(`/main/smartcare/management/${targetId}`);
      }
  } catch {
      toast.error("Erro ao vincular você ao chamado.", { id: linkingToast });
    } finally {
      setLinkingSelf(false);
    }
  }, [selectedTicketForLinking, user, fetchTickets, filters, currentPage, pageSize, router]);

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
    <div className="space-y-4 min-w-0">
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
  <Card className="w-full">
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
          <Card className="w-full">
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
                  <div className="flex gap-1">
                    <Input
                      id="category_id"
                      placeholder="Selecione categorias"
                      value={selectedCategoryIds.length > 0 ? 
                        selectedCategoryIds.length === 1 
                          ? categories.find(c => String(c.id) === selectedCategoryIds[0])?.name || ""
                          : `${selectedCategoryIds.length} categorias selecionadas`
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || optionsLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Categorias</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar categoria..."
                              value={categorySearchTerm}
                              onChange={(e) => setCategorySearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleSelectAllCategories}
                            >
                              Selecionar Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleClearAllCategories}
                            >
                              Limpar Todos
                            </Button>
                          </div>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {optionsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredCategories().map((category) => (
                                <div
                                  key={category.id}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedCategoryIds.includes(String(category.id)) 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'border border-transparent'
                                  }`}
                                  onClick={() => handleCategoryToggle(String(category.id))}
                                >
                                  <Checkbox
                                    checked={selectedCategoryIds.includes(String(category.id))}
                                    onCheckedChange={() => handleCategoryToggle(String(category.id))}
                                  />
                                  <span className="flex-1">{category.name}</span>
                                </div>
                              ))
                            )}
                            {!optionsLoading && getFilteredCategories().length === 0 && categorySearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhuma categoria encontrada
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setCategoryDialogOpen(false);
                                setCategorySearchTerm("");
                              }}
                            >
                              Fechar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                  <div className="flex gap-1">
                    <Input
                      id="module_id"
                      placeholder="Selecione módulos"
                      value={selectedModuleIds.length > 0 ? 
                        selectedModuleIds.length === 1 
                          ? modules.find(m => String(m.id) === selectedModuleIds[0])?.name || ""
                          : `${selectedModuleIds.length} módulos selecionados`
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || optionsLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Módulos</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar módulo..."
                              value={moduleSearchTerm}
                              onChange={(e) => setModuleSearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleSelectAllModules}
                            >
                              Selecionar Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleClearAllModules}
                            >
                              Limpar Todos
                            </Button>
                          </div>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {optionsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredModules().map((module) => (
                                <div
                                  key={module.id}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedModuleIds.includes(String(module.id)) 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'border border-transparent'
                                  }`}
                                  onClick={() => handleModuleToggle(String(module.id))}
                                >
                                  <Checkbox
                                    checked={selectedModuleIds.includes(String(module.id))}
                                    onCheckedChange={() => handleModuleToggle(String(module.id))}
                                  />
                                  <span className="flex-1">{module.name}</span>
                                </div>
                              ))
                            )}
                            {!optionsLoading && getFilteredModules().length === 0 && moduleSearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhum módulo encontrado
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setModuleDialogOpen(false);
                                setModuleSearchTerm("");
                              }}
                            >
                              Fechar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status_id">Status</Label>
                  <div className="flex gap-1">
                    <Input
                      id="status_id"
                      placeholder="Selecione status"
                      value={selectedStatusIds.length > 0 ? 
                        selectedStatusIds.length === 1 
                          ? ticketStatuses.find(s => String(s.id) === selectedStatusIds[0])?.name || ""
                          : `${selectedStatusIds.length} status selecionados`
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || statusesLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar status..."
                              value={statusSearchTerm}
                              onChange={(e) => setStatusSearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleSelectAllStatuses}
                            >
                              Selecionar Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleClearAllStatuses}
                            >
                              Limpar Todos
                            </Button>
                          </div>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {statusesLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredStatuses().map((status) => (
                                <div
                                  key={status.id}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedStatusIds.includes(String(status.id)) 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'border border-transparent'
                                  }`}
                                  onClick={() => handleStatusToggle(String(status.id))}
                                >
                                  <Checkbox
                                    checked={selectedStatusIds.includes(String(status.id))}
                                    onCheckedChange={() => handleStatusToggle(String(status.id))}
                                  />
                                  <span className="flex-1">{status.name}</span>
                                </div>
                              ))
                            )}
                            {!statusesLoading && getFilteredStatuses().length === 0 && statusSearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhum status encontrado
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setStatusDialogOpen(false);
                                setStatusSearchTerm("");
                              }}
                            >
                              Fechar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority_id">Prioridade</Label>
                  <div className="flex gap-1">
                    <Input
                      id="priority_id"
                      placeholder="Selecione prioridades"
                      value={selectedPriorityIds.length > 0 ? 
                        selectedPriorityIds.length === 1 
                          ? priorities.find(p => String(p.id) === selectedPriorityIds[0])?.name || ""
                          : `${selectedPriorityIds.length} prioridades selecionadas`
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || optionsLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Prioridades</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar prioridade..."
                              value={prioritySearchTerm}
                              onChange={(e) => setPrioritySearchTerm(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleSelectAllPriorities}
                            >
                              Selecionar Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={handleClearAllPriorities}
                            >
                              Limpar Todos
                            </Button>
                          </div>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {optionsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredPriorities().map((priority) => (
                                <div
                                  key={priority.id}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedPriorityIds.includes(String(priority.id)) 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'border border-transparent'
                                  }`}
                                  onClick={() => handlePriorityToggle(String(priority.id))}
                                >
                                  <Checkbox
                                    checked={selectedPriorityIds.includes(String(priority.id))}
                                    onCheckedChange={() => handlePriorityToggle(String(priority.id))}
                                  />
                                  <span className="flex-1">{priority.name}</span>
                                </div>
                              ))
                            )}
                            {!optionsLoading && getFilteredPriorities().length === 0 && prioritySearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhuma prioridade encontrada
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPriorityDialogOpen(false);
                                setPrioritySearchTerm("");
                              }}
                            >
                              Fechar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                {/* {!user?.is_client && (
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
                )} */}
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
                {/* Filtro: Criado Por */}
                <div className="space-y-2">
                  <Label htmlFor="created_by">Criado Por</Label>
                  <div className="flex gap-1">
                    <Input
                      id="created_by"
                      placeholder="Selecione quem criou"
                      value={pendingFilters.created_by ? 
                        createdByUsers.find(u => u.id === pendingFilters.created_by)?.first_name 
                          ? `${createdByUsers.find(u => u.id === pendingFilters.created_by)?.first_name} ${createdByUsers.find(u => u.id === pendingFilters.created_by)?.last_name}` 
                          : createdByUsers.find(u => u.id === pendingFilters.created_by)?.email || pendingFilters.created_by
                        : ""
                      }
                      disabled={true}
                      className="cursor-pointer"
                    />
                    <Dialog open={createdByDialogOpen} onOpenChange={setCreatedByDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          disabled={loading || createdByUsersLoading}
                        >
                          <SquareMousePointer className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Selecionar Criador</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                            placeholder="Buscar por nome ou email..."
                            value={createdBySearchTerm}
                            onChange={(e) => setCreatedBySearchTerm(e.target.value)}
                            className="pl-8"
                            />
                          </div>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                handleFilterChange("created_by", "");
                                setCreatedByDialogOpen(false);
                                setCreatedBySearchTerm("");
                              }}
                            >
                              Todos os criadores
                            </Button>
                            {createdByUsersLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              getFilteredCreatedByUsers().map((user) => (
                                <Button
                                  key={user.id}
                                  variant="ghost"
                                  className="w-full justify-start h-auto p-3"
                                  onClick={() => {
                                    handleFilterChange("created_by", user.id);
                                    setCreatedByDialogOpen(false);
                                    setCreatedBySearchTerm("");
                                  }}
                                >
                                  <div className="text-left">
                                    <div className="font-medium">
                                      {user.first_name && user.last_name ? 
                                        `${user.first_name} ${user.last_name}` : 
                                        user.email
                                      }
                                    </div>
                                    {user.first_name && user.last_name && user.email && (
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {user.email}
                                      </div>
                                    )}
                                  </div>
                                </Button>
                              ))
                            )}
                            {!createdByUsersLoading && getFilteredCreatedByUsers().length === 0 && createdBySearchTerm && (
                              <div className="text-center text-muted-foreground py-4">
                                Nenhum criador encontrado
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
        <div className="w-full">
          {/* Container de largura fixa da página */}
          <div className="max-w-full" style={{ width: 1200 }}>
            {/* Wrapper com scroll horizontal quando DataTable exceder a largura fixa */}
            <div className="overflow-x-auto max-w-auto">
              <DataTable 
                columns={getColumns(user, handleLinkResource)} 
                data={tickets} 
                onRowClick={handleRowClick}
                showColumnVisibility={true}
                showPagination={false}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                columnLabels={{
                  'open_ticket': 'Abrir',
                  'external_id': 'Id Chamado',
                  'ref_external_id': 'Ref. Externa',
                  'project': 'Projeto',
                  'partner': 'Parceiro',
                  'category': 'Categoria',
                  'title': 'Título',
                  'module': 'Módulo Func.',
                  'status': 'Status',
                  'created_at': 'Criado em',
                  'created_by': 'Criado Por',
                  'priority': 'Prioridade',
                  'planned_end_date': 'Prev. Fim',
                  'main_resource': 'Recurso Principal',
                  'other_resources': 'Demais Recursos',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dialog para vincular recurso */}
      <LinkResourceDialog
        open={linkResourceDialogOpen}
        onOpenChange={setLinkResourceDialogOpen}
        ticket={selectedTicketForLinking}
        onSuccess={handleLinkResourceSuccess}
      />

      {/* Confirmação de auto-vínculo (Vincular-se) */}
      <Dialog open={confirmLinkOpen} onOpenChange={setConfirmLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Vinculação</DialogTitle>
            <DialogDescription>
              Deseja se vincular ao chamado {selectedTicketForLinking?.external_id || selectedTicketForLinking?.id}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLinkOpen(false)} disabled={linkingSelf}>
              Cancelar
            </Button>
            <Button variant="colored2" onClick={handleConfirmLinkSelf} disabled={linkingSelf}>
              {linkingSelf ? "Vinculando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick view do chamado ao clicar na linha */}
      <TicketQuickViewDialog
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        ticket={quickViewTicket}
        onLinkSelf={handleLinkSelfFromQuickView}
        onOpenFullPage={(t) => {
          const targetId = (t as unknown as { external_id?: string | number }).external_id ?? t.id;
          if (targetId) router.push(`/main/smartcare/management/${targetId}`);
        }}
      />
    </div>
  );
}