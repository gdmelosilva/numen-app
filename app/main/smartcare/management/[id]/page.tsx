"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import type { Ticket } from "@/types/tickets";
// import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookOpenText, Calendar, Info, UserCircle, ChevronLeft, ChevronRight, File, Edit3, EyeOff, Lock, Edit } from "lucide-react";
import { Loader2 } from "lucide-react";
import React from "react";
import MessageForm from "@/components/message-form";
import { MessageCard } from "@/components/message-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserContext } from "@/components/user-context";
import type { UserWithModule } from "@/types/users";
import Timeline from "@/components/Timeline";
import { ForwardButton } from "@/components/ForwardButton";
import { isTicketFinalized } from "@/lib/ticket-status";
import { getCategoryOptions, getPriorityOptions } from "@/hooks/useOptions";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ParalizarChamadoButton from "@/components/ButtonParalizarChamado";
import SolicitarEncerramentoButton from "@/components/ButtonSolicitarEncerramento";

// Define o tipo correto para o recurso retornado pelo backend
interface TicketResource {
  user_id: string;
  ticket_id: string;
  is_main?: boolean;
  user?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    is_client?: boolean;
  };
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mensagens e paginação
  type Message = {
    id: string;
    ticket_id?: string;
    msgStatus?: string;
    msgPrivate?: boolean;
    msgHours?: number | string;
    msgBody?: string;
    createdAt?: string;
    user?: { name?: string; is_client?: boolean };
    attachments?: { id: string; name: string; path: string }[];
    is_system?: boolean; // Adiciona flag para mensagens do sistema
    msg_ref?: string;
    ref_msg_id?: string;
  };
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 6; // Altera para 6 mensagens por página
  const [activeTab, setActiveTab] = useState<string>("details");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const { user: currentUser } = useUserContext();
  const [resources, setResources] = useState<TicketResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserWithModule[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState("");
  // const { statuses: ticketStatuses, loading: statusesLoading } = useTicketStatuses();
  
  // Estados para paginação da tabela de recursos
  const [currentResourcePage, setCurrentResourcePage] = useState(1);
  const resourcesPerPage = 8; // 8 usuários por página
  
  // Estados para gerenciar a data de encerramento estimada
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [plannedEndDate, setPlannedEndDate] = useState<string>("");
  const [updatingDate, setUpdatingDate] = useState(false);
  
  // Estado para horas estimadas
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [loadingEstimatedHours, setLoadingEstimatedHours] = useState(false);
  
  // Estados para filtros de mensagens
  const [hideSystemMessages, setHideSystemMessages] = useState(false);
  const [hidePrivateMessages, setHidePrivateMessages] = useState(false);

  // Estados para edição de categoria, módulo e prioridade
  const [editingField, setEditingField] = useState<'category' | 'module' | 'priority' | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; description: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [updatingField, setUpdatingField] = useState(false);

  // Estados para ações do cliente (paralisar/solicitar encerramento)
  const [confirmOpen, setConfirmOpen] = useState<null | { action: "pause" | "close"; title: string }>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Status IDs fixos solicitados: 14 = Paralizado pelo Solicitante, 4 = Finalizado

  // Corrige mapeamento das mensagens vindas do backend para o formato esperado pelo frontend
  const mapMessageBackendToFrontend = useCallback((msg: Record<string, unknown>): Message => ({
    id: String(msg.id),
    ticket_id: typeof msg.ticket_id === 'string' ? msg.ticket_id : undefined,
    msgStatus: msg.status_id ? String(msg.status_id) : undefined,
    msgPrivate: Boolean(msg.is_private),
    msgHours: typeof msg.hours === 'number' || typeof msg.hours === 'string' ? msg.hours : undefined,
    msgBody: typeof msg.body === 'string' ? msg.body : '',
    createdAt: typeof msg.created_at === 'string' ? msg.created_at : '',
    user: (() => {
      // 1. user
      if (typeof msg.user === 'object' && msg.user !== null) {
        const u = msg.user as { name?: string; first_name?: string; last_name?: string; is_client?: boolean };
        if (u.first_name || u.last_name) {
          return { 
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            is_client: u.is_client
          };
        }
        if (u.name) return { name: u.name, is_client: u.is_client };
      }
      // 2. created_by_user
      if (typeof msg.created_by_user === 'object' && msg.created_by_user !== null) {
        const u = msg.created_by_user as { name?: string; first_name?: string; last_name?: string; is_client?: boolean };
        if (u.first_name || u.last_name) {
          return { 
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            is_client: u.is_client
          };
        }
        if (u.name) return { name: u.name, is_client: u.is_client };
      }
      // 3. created_by (objeto ou string)
      if (typeof msg.created_by === 'object' && msg.created_by !== null) {
        const u = msg.created_by as { name?: string; first_name?: string; last_name?: string; is_client?: boolean };
        if (u.first_name || u.last_name) {
          return { 
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            is_client: u.is_client
          };
        }
        if (u.name) return { name: u.name, is_client: u.is_client };
        // fallback: se tiver email
        if ('email' in u && typeof (u as { email?: string }).email === 'string' && (u as { email?: string }).email) {
          return { name: (u as { email?: string }).email!, is_client: u.is_client };
        }
      }
      if (typeof msg.created_by === 'string') return { name: msg.created_by };
      // 4. Se vier como string
      if (typeof msg.user === 'string') return { name: msg.user };
      if (typeof msg.created_by_user === 'string') return { name: msg.created_by_user };
      return { name: '' };
    })(),
    attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
    is_system: Boolean(msg.is_system), // Mapeia is_system
    msg_ref: typeof msg.msg_ref === 'string' ? msg.msg_ref : undefined,
    ref_msg_id: typeof msg.ref_msg_id === 'string' ? msg.ref_msg_id : undefined,
  }), []);

  // Calcular total de horas das mensagens
  // const totalHours = allMessages.reduce((total, msg) => {
  //   return total + (msg.msgHours ? parseFloat(msg.msgHours.toString()) : 0);
  // }, 0);

  // Busca apenas as mensagens do ticket
  // Refs estáveis para evitar dependências em cascata
  const fetchEstimatedHoursRef = useRef<() => Promise<void>>(async () => {});
  const refreshTicketDataRef = useRef<() => Promise<void>>(async () => {});

  const refreshMessages = useCallback(async () => {
    if (!ticket) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?ticket_id=${ticket.id}`);
      if (!res.ok) throw new Error("Erro ao buscar mensagens");
      const msgs = await res.json();
      const mappedMessages = Array.isArray(msgs) ? msgs.map(mapMessageBackendToFrontend) : [];
      setAllMessages(mappedMessages);
      setMessagesLoaded(true);
      
      await fetchEstimatedHoursRef.current();
      await refreshTicketDataRef.current();
    } catch {
      setAllMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [ticket, mapMessageBackendToFrontend]);

  // Carrega apenas o ticket no início
  useEffect(() => {
    async function fetchTicket() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/smartcare?external_id=${id}`);
        if (!response.ok) throw new Error("Erro ao buscar detalhes do chamado");
        const data = await response.json();
        const ticketData = Array.isArray(data) ? data[0] : data;
        setTicket(ticketData);
        
        // Inicializa a data de encerramento estimada se existir
        if (ticketData.planned_end_date) {
          setPlannedEndDate(ticketData.planned_end_date.split('T')[0]); // Formato YYYY-MM-DD
        }
      } catch {
        setError("Erro ao buscar detalhes do chamado");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTicket();
  }, [id]);

  // Função para atualizar os dados do ticket sem loading
  const refreshTicketData = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/smartcare?external_id=${id}`);
      if (!response.ok) throw new Error("Erro ao buscar detalhes do chamado");
      const data = await response.json();
      const ticketData = Array.isArray(data) ? data[0] : data;
      setTicket(ticketData);
      
      // Atualiza a data de encerramento estimada se mudou
      if (ticketData.planned_end_date) {
        setPlannedEndDate(ticketData.planned_end_date.split('T')[0]);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do ticket:", error);
    }
  }, [id]);

  // Busca mensagens apenas ao ativar a aba 'messages' e se ainda não carregou
  useEffect(() => {
    if (activeTab === "messages" && ticket && !messagesLoaded) {
      refreshMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, ticket]);

  // Busca recursos vinculados ao chamado (projeto)
  const fetchResources = useCallback(async () => {
    if (!ticket?.project_id) return;
    setResourcesLoading(true);
    try {
      // Busca todos os recursos vinculados ao ticket (já vem com user)
      const res = await fetch(`/api/ticket-resources?ticket_id=${ticket.id}`);
      if (!res.ok) throw new Error("Erro ao buscar recursos do chamado");
      const data = await res.json();
      setResources(Array.isArray(data) ? data : []);
    } catch {
      setResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [ticket?.project_id, ticket?.id]);

  // Busca usuários disponíveis para vínculo
  const fetchAvailableUsers = useCallback(async () => {
    if (!ticket?.project_id) return;
    setAvailableLoading(true);
    setResourceError(null);
    try {
      // Busca usuários do projeto que não são clientes
      const res = await fetch(`/api/admin/user-partner/available-for-project?project_id=${ticket.project_id}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários disponíveis");
      const users = await res.json();
      setAvailableUsers(Array.isArray(users) ? users : []);
    } catch {
      setResourceError("Erro ao buscar usuários disponíveis");
      setAvailableUsers([]);
    } finally {
      setAvailableLoading(false);
    }
  }, [ticket?.project_id]);

  // Função para buscar horas estimadas do ticket
  const fetchEstimatedHours = useCallback(async () => {
    if (!ticket?.id) return;
    
    setLoadingEstimatedHours(true);
    try {
      const response = await fetch(`/api/messages?ticket_id=${ticket.id}`);
      if (!response.ok) throw new Error('Erro ao buscar horas estimadas');
      
      const messages = await response.json();
      let totalHours = 0;
      
      if (Array.isArray(messages)) {
        totalHours = messages.reduce((sum, msg) => {
          // Para usuários clientes, só considerar mensagens não-privadas
          if (currentUser?.is_client && msg.is_private) {
            return sum;
          }
          
          const hours = typeof msg.hours === 'number' ? msg.hours : 
                       typeof msg.hours === 'string' ? parseFloat(msg.hours) : 0;
          return sum + (isNaN(hours) ? 0 : hours);
        }, 0);
      }
      
      setEstimatedHours(totalHours);
    } catch (error) {
      console.error('Erro ao buscar horas estimadas:', error);
      setEstimatedHours(0);
    } finally {
      setLoadingEstimatedHours(false);
    }
  }, [ticket?.id, currentUser?.is_client]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Atualiza refs com funções reais após declaração
  useEffect(() => { fetchEstimatedHoursRef.current = fetchEstimatedHours; }, [fetchEstimatedHours]);
  useEffect(() => { refreshTicketDataRef.current = refreshTicketData; }, [refreshTicketData]);

  // Buscar horas estimadas quando o ticket for carregado
  useEffect(() => {
    if (ticket?.id) {
      fetchEstimatedHours();
    }
  }, [ticket?.id, fetchEstimatedHours]);

  // Resetar página atual quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [hideSystemMessages, hidePrivateMessages]);

  // Resetar página de recursos quando a busca mudar ou dialog abrir
  useEffect(() => {
    setCurrentResourcePage(1);
  }, [searchUser, showResourceDialog]);

  // Paginação para mensagens
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Paginação para recursos
  const goToResourcePage = (page: number) => {
    if (page >= 1 && page <= totalResourcePages) {
      setCurrentResourcePage(page);
    }
  };
  const goToPreviousResourcePage = () => {
    if (currentResourcePage > 1) {
      setCurrentResourcePage(currentResourcePage - 1);
    }
  };
  const goToNextResourcePage = () => {
    if (currentResourcePage < totalResourcePages) {
      setCurrentResourcePage(currentResourcePage + 1);
    }
  };

  // Função para buscar módulos de tickets via API
  const fetchModuleOptions = async () => {
    try {
      const response = await fetch('/api/options?type=ticket_modules');
      if (!response.ok) throw new Error('Erro ao buscar módulos');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      return [];
    }
  };

  // Função para carregar todas as opções
  const loadEditOptions = async (field: 'category' | 'module' | 'priority') => {
    setOptionsLoading(true);
    try {
      if (field === 'category') {
        // Para smartcare, buscar categorias AMS (is_ams = true)
        const data = await getCategoryOptions(true);
        setCategories(data);
      } else if (field === 'module') {
        const data = await fetchModuleOptions();
        setModules(data);
      } else if (field === 'priority') {
        const data = await getPriorityOptions();
        setPriorities(data);
      }
    } catch (error) {
      console.error(`Erro ao carregar opções de ${field}:`, error);
      toast.error(`Erro ao carregar opções de ${field}`);
    } finally {
      setOptionsLoading(false);
    }
  };

  // Função para iniciar edição
  const startEdit = (field: 'category' | 'module' | 'priority') => {
    if (isTicketFinalized(ticket)) {
      toast.error("Não é possível editar um chamado finalizado");
      return;
    }

    setEditingField(field);
    
    // Define o valor atual
    if (field === 'category') {
      setSelectedValue(ticket?.category_id ? String(ticket.category_id) : "");
    } else if (field === 'module') {
      setSelectedValue(ticket?.module_id ? String(ticket.module_id) : "");
    } else if (field === 'priority') {
      setSelectedValue(ticket?.priority_id ? String(ticket.priority_id) : "");
    }
    
    loadEditOptions(field);
  };

  // Função para salvar edição
  const saveEdit = async () => {
    if (!editingField || !selectedValue || !ticket) return;

    setUpdatingField(true);
    try {
      const fieldMap = {
        category: 'category_id',
        module: 'module_id', 
        priority: 'priority_id'
      };

      const response = await fetch(`/api/smartcare/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldMap[editingField]]: selectedValue
        }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar campo');

      // Atualiza o ticket localmente
      const updatedTicket = { ...ticket };
      if (editingField === 'category') {
        updatedTicket.category_id = Number(selectedValue);
        const category = categories.find(c => c.id === selectedValue);
        if (category) {
          updatedTicket.category = { id: Number(selectedValue), name: category.name };
        }
      } else if (editingField === 'module') {
        updatedTicket.module_id = Number(selectedValue);
        const selectedModule = modules.find(m => m.id === selectedValue);
        if (selectedModule) {
          updatedTicket.module = { id: Number(selectedValue), name: selectedModule.name };
        }
      } else if (editingField === 'priority') {
        updatedTicket.priority_id = Number(selectedValue);
        const priority = priorities.find(p => p.id === selectedValue);
        if (priority) {
          updatedTicket.priority = { id: Number(selectedValue), name: priority.name };
        }
      }

      setTicket(updatedTicket);
      setEditingField(null);
      toast.success(`${editingField === 'category' ? 'Categoria' : editingField === 'module' ? 'Módulo' : 'Prioridade'} atualizada com sucesso`);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar campo');
    } finally {
      setUpdatingField(false);
    }
  };

  // Função para cancelar edição
  const cancelEdit = () => {
    setEditingField(null);
    setSelectedValue("");
  };

  // Ações: Paralisar / Solicitar Encerramento
  const doChangeStatus = useCallback(
    async (action: "pause" | "close") => {
      if (!ticket) return;
      setSubmitting(true);
      try {
        // IDs definidos pelo produto
        const target = action === "pause"
          ? { id: 14, label: "Paralizado pelo Solicitante" }
          : { id: 4, label: "Finalizado" };

        // Verifica se haverá mudança de status
        const currentStatusId = ticket.status_id != null ? Number(ticket.status_id) : null;
        const willUpdateStatus = currentStatusId !== target.id;

        // Corpo padrão da mensagem
        const msgBody = (reason?.trim()) || (action === "pause"
          ? "Cliente solicitou paralisação do chamado."
          : "Cliente solicitou encerramento do chamado.");

        // 1) Cria a mensagem seguindo o fluxo do MessageForm
        const msgRes = await fetch(`/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: msgBody,
            is_private: false,
            status_id: target.id,
            ticket_id: ticket.id,
          }),
        });
        if (!msgRes.ok) {
          const errData = await msgRes.json().catch(() => ({}));
          throw new Error(errData.error ?? "Erro ao criar mensagem");
        }

        // 2) Atualiza o ticket somente se o status mudou
        if (willUpdateStatus) {
          const updRes = await fetch(`/api/tickets`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket_id: ticket.id, status_id: target.id }),
          });
          if (!updRes.ok) {
            const errTicket = await updRes.json().catch(() => ({}));
            throw new Error(errTicket.error ?? "Erro ao atualizar status do ticket");
          }
        }

        toast.success(`Status atualizado: ${target.label}`);

        await refreshTicketData();
        if (activeTab === "messages") await refreshMessages();
        await fetchResources();
        setConfirmOpen(null);
        setReason("");
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível atualizar o status");
      } finally {
        setSubmitting(false);
      }
    },
    [ticket, reason, refreshTicketData, activeTab, fetchResources, refreshMessages]
  );

  // Ordena mensagens da mais nova para a mais antiga
  const sortedMessages = [...allMessages].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Aplica filtros baseados nos estados
  const filteredMessages = sortedMessages.filter((message) => {
    // Filtro para mensagens do sistema
    if (hideSystemMessages && message.is_system) {
      return false;
    }
    
    // Filtro para mensagens privadas
    if (hidePrivateMessages && message.msgPrivate) {
      return false;
    }
    
    // Usuários clientes não devem ver mensagens privadas (independente do filtro)
    if (currentUser?.is_client && message.msgPrivate) {
      return false;
    }
    
    return true;
  });
  
  // Paginação baseada nas mensagens filtradas
  const totalMessages = filteredMessages.length;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = filteredMessages.slice(startIndex, endIndex);

  // Paginação para recursos do dialog
  const filteredUsers = availableUsers.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchUser.toLowerCase())
  );
  const totalResources = filteredUsers.length;
  const totalResourcePages = Math.ceil(totalResources / resourcesPerPage);
  const resourceStartIndex = (currentResourcePage - 1) * resourcesPerPage;
  const resourceEndIndex = resourceStartIndex + resourcesPerPage;
  const currentResources = filteredUsers.slice(resourceStartIndex, resourceEndIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !ticket) {
    return <div className="p-6 text-destructive">{error || "Chamado não encontrado."}</div>;
  }

  // Status options for Select
  const statusOptions = [
    ...(ticket && ticket.status && typeof ticket.status === "object" && "name" in ticket.status && ticket.status_id
      ? [{ value: String(ticket.status_id), label: ticket.status.name }]
      : []),
    // Add more status options here if available from API
  ];

  // Helpers para exibição de botões de ação (cliente)
  const statusId = ticket.status_id != null ? Number(ticket.status_id) : null;
  const statusName =
    ticket && typeof ticket.status === "object" && ticket.status && "name" in ticket.status
      ? String((ticket.status as { name?: string }).name || "").trim()
      : "";
  const isPausedByRequester = statusId === 14 || /parali\w*\s*pelo\s*solicitante/i.test(statusName) || /parali\w*/i.test(statusName);
  const isCloseRequested = /solicitad\w*\s*encerramento/i.test(statusName);
  const isFinalized = statusId === 4 || isTicketFinalized(ticket);

  // Função utilitária para montar o nome do criador do ticket, igual ao padrão das mensagens
  function getTicketCreatorName(ticket: Ticket): string {
    // 1. created_by_user
    if (typeof ticket.created_by_user === 'object' && ticket.created_by_user !== null) {
      const u = ticket.created_by_user as { name?: string; first_name?: string; last_name?: string; email?: string };
      if (u.first_name || u.last_name) {
        return `${u.first_name || ''} ${u.last_name || ''}`.trim();
      }
      if (u.name) return u.name;
      if (u.email) return u.email;
    }
    // 2. created_by (objeto ou string)
    if (typeof ticket.created_by === 'object' && ticket.created_by !== null) {
      const u = ticket.created_by as { name?: string; first_name?: string; last_name?: string; email?: string };
      if (u.first_name || u.last_name) {
        return `${u.first_name || ''} ${u.last_name || ''}`.trim();
      }
      if (u.name) return u.name;
      if (u.email) return u.email;
    }
    if (typeof ticket.created_by === 'string') return ticket.created_by;
    return '-';
  }

  const hideResourceActions = currentUser && (currentUser.is_client || (currentUser.role === 3 && !currentUser.is_client));

  // Função para atualizar a data de encerramento estimada
  const updatePlannedEndDate = async () => {
    if (!ticket?.id || !plannedEndDate) return;
    
    setUpdatingDate(true);
    try {
      const response = await fetch(`/api/smartcare?id=${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_end_date: plannedEndDate
        })
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar data');
      
      // Atualiza o ticket no estado local
      setTicket(prev => prev ? { ...prev, planned_end_date: plannedEndDate } : null);
      setShowDateDialog(false);
      
      // Força um novo fetch das mensagens se elas já foram carregadas
      if (messagesLoaded) {
        await refreshMessages();
      }
      
      // Atualiza as horas estimadas também
      await fetchEstimatedHours();
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      alert('Erro ao atualizar data de encerramento estimada');
    } finally {
      setUpdatingDate(false);
    }
  };

  // Função para obter o nome do status pelo id
  // function getStatusName(statusObj: unknown, statusId: string | number | undefined) {
  //   if (statusesLoading) return "Carregando...";
  //   if (statusObj && typeof statusObj === 'object' && 'name' in statusObj) return String((statusObj as { name: string }).name).trim();
  //   if (!statusId) return "Sem status";
  //   const found = ticketStatuses.find(s => String(s.id) === String(statusId));
  //   return found ? String(found.name).trim() : "Sem status";
  // }

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
      <div className="flex items-center justify-between mb-4 gap-2">
        <TabsList className="mb-0">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="messages">
            {totalMessages > 0 ? `Mensagens (${totalMessages})` : "Mensagens"}
          </TabsTrigger>
        </TabsList>
        {currentUser?.is_client && !isCloseRequested && !isFinalized && (
          <div className="flex items-center gap-2">
            {!isPausedByRequester && (
              <ParalizarChamadoButton
                onClick={() => {
                  setConfirmOpen({ action: "pause", title: "Paralisar Chamado" });
                  setReason("");
                }}
                disabled={isFinalized}
                loading={submitting}
              />
            )}
            <SolicitarEncerramentoButton
              onClick={() => {
                setConfirmOpen({ action: "close", title: "Solicitar Encerramento" });
                setReason("");
              }}
              disabled={isFinalized}
              loading={submitting}
            />
          </div>
        )}
      </div>
      <Card className="p-6 rounded-md w-full h-full">
        <TabsContent value="details">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
              <div className="text-xl font-semibold flex-1">
                {String(ticket.external_id).padStart(5, "0")} - {ticket.title}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-4 text-md text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("pt-BR") : "-"}
                </div>
                <div className="inline-flex items-center gap-1 italic text-md">
                  <UserCircle className="w-4 h-4" />
                  {getTicketCreatorName(ticket)}
                </div>
                <ColoredBadge 
                  type="ticket_status" 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={ticket.status as any}
                  className="text-md"
                />
              </div>
              {/* <div className="flex flex-col items-end align-middle justify-center">
                <span className="text-muted-foreground text-xs font-medium mb-1"></span>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {totalHours > 0 ? `${totalHours.toFixed(1)}h` : "0h"}
                </Badge>
              </div> */}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="my-4 mb-4" />
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-2">
                <BookOpenText className="w-4 h-4" />
                Descrição
              </div>
              {typeof ticket.description === 'string' ? ticket.description : '-'}
            </div>
          </CardContent>
          <CardContent>
            <Separator className="my-4 mb-4" />
            <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
              <Info className="w-4 h-4" />
              Informações do Chamado
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">Tipo</span>
                </div>
                <span>{(typeof ticket.type === 'object' && ticket.type && 'name' in ticket.type) ? ticket.type.name : (typeof ticket.module_id === 'string' || typeof ticket.module_id === 'number' ? ticket.module_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">Categoria</span>
                  {currentUser && !currentUser.is_client && !isTicketFinalized(ticket) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEdit('category')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <span>{(typeof ticket.category === 'object' && ticket.category && 'name' in ticket.category) ? ticket.category.name : (typeof ticket.category_id === 'string' || typeof ticket.category_id === 'number' ? ticket.category_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">Módulo</span>
                  {currentUser && !currentUser.is_client && !isTicketFinalized(ticket) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEdit('module')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <span>{(typeof ticket.module === 'object' && ticket.module && 'name' in ticket.module) ? ticket.module.name : (typeof ticket.module_id === 'string' || typeof ticket.module_id === 'number' ? ticket.module_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">Prioridade</span>
                  {currentUser && !currentUser.is_client && !isTicketFinalized(ticket) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEdit('priority')}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <span>{(typeof ticket.priority === 'object' && ticket.priority && 'name' in ticket.priority) ? ticket.priority.name : (typeof ticket.priority_id === 'string' || typeof ticket.priority_id === 'number' ? ticket.priority_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Projeto</span>
                <span>{(typeof ticket.project === 'object' && ticket.project && 'projectName' in ticket.project) ? ticket.project.projectName : (typeof ticket.project_id === 'string' || typeof ticket.project_id === 'number' ? ticket.project_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Parceiro</span>
                <span>{(typeof ticket.partner === 'object' && ticket.partner && 'partner_desc' in ticket.partner)
                  ? ticket.partner.partner_desc
                  : (typeof ticket.partner_id === 'string' || typeof ticket.partner_id === 'number' ? ticket.partner_id : '-')}</span>
              </div>
              {/* Horas Estimadas - visível para todos os usuários */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Horas Estimadas</span>
                <span>
                  {loadingEstimatedHours ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">Calculando...</span>
                    </div>
                  ) : (
                    `${estimatedHours > 0 ? estimatedHours.toFixed(1) : '0'}h`
                  )}
                </span>
              </div>
              {/* Data de Encerramento Estimada - só aparece para usuários não-clientes */}
              {currentUser && !currentUser.is_client && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium">Data de Encerramento Estimada</span>
                  <div className="flex items-center gap-2">
                    <span>
                      {ticket.planned_end_date 
                        ? new Date(ticket.planned_end_date).toLocaleDateString('pt-BR')
                        : 'Não definida'
                      }
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDateDialog(true)}
                      className="h-6 px-2 text-xs"
                      disabled={isTicketFinalized(ticket)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  </div>
                </div>
              )}
              {/* Ticket Referência */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Ticket Referência</span>
                <span>{ticket.ref_ticket_id ? String(ticket.ref_ticket_id) : '-'}</span>
              </div>
              {/* Identificação Externa */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Identificação Externa</span>
                <span>{ticket.ref_external_id ? String(ticket.ref_external_id) : '-'}</span>
              </div>
            </div>
            <Separator className="my-4 mb-4" />
            <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
              <File className="w-4 h-4" />
              Anexos do Chamado
            </div>
            {/* Exibição de anexos apenas das mensagens */}
            {(() => {
              const messageAttachments = allMessages.reduce((acc: { id: string; name: string; path: string; messageId: string; messageDate: string; userName: string }[], msg) => {
                if (msg.attachments && msg.attachments.length > 0) {
                  const attachmentsWithMessageInfo = msg.attachments.map(attachment => ({
                    ...attachment,
                    messageId: msg.id,
                    messageDate: msg.createdAt || '',
                    userName: msg.user?.name || "Usuário desconhecido"
                  }));
                  return [...acc, ...attachmentsWithMessageInfo];
                }
                return acc;
              }, []);
              if (messageAttachments.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground italic">
                    Nenhum anexo encontrado neste chamado.
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Anexos das Mensagens:</h4>                    <ul className="list-none space-y-2 text-sm ml-4">
                      {messageAttachments.map((file) => (
                        <li key={file.id} className="border-l-2 border-gray-300 pl-3">
                          <div className="flex flex-col">
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/download?path=${encodeURIComponent(file.path)}`);
                                  if (!response.ok) {
                                    throw new Error('Erro ao baixar arquivo');
                                  }
                                  
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = url;
                                  a.download = file.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                } catch (error) {
                                  console.error('Erro ao baixar arquivo:', error);
                                  alert('Erro ao baixar arquivo. Tente novamente.');
                                }
                              }}
                              className="hover:underline text-blue-600 text-left cursor-pointer bg-transparent border-none p-0"
                            >
                              {file.name}
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {file.userName} - {file.messageDate ? new Date(file.messageDate).toLocaleString("pt-BR") : ""}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
            <Separator className="my-4 mb-4" />
            
            {/* Timeline do Chamado */}
            <Timeline ticketId={ticket?.id} />
            <Separator className="my-4 mb-4" />
          </CardContent>
          {/* --- Recursos vinculados ao chamado --- */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium">
                <UserCircle className="w-4 h-4" /> Recursos vinculados ao chamado
              </div>
              {!hideResourceActions && (
                <Button size="sm" variant="outline" onClick={() => { setShowResourceDialog(true); fetchAvailableUsers(); }}>
                  Vincular Recurso
                </Button>
              )}
            </div>
            {(() => {
              if (resourcesLoading) {
                return (
                  <div className="text-muted-foreground text-sm">Carregando recursos...</div>
                );
              }
              if (resources.length === 0) {
                return (
                  <div className="text-muted-foreground text-sm italic">Nenhum recurso vinculado a este chamado.</div>
                );
              }
              return (
                <ul className="list-disc ml-6 space-y-1">
                  {resources.map((r) => (
                    <li key={r.user_id} className="text-sm flex items-center justify-between gap-2">
                      <span>
                        <strong>{r.user?.first_name} {r.user?.last_name}</strong> - <strong>{r.user?.is_client ? "Cliente" : "Numen"}</strong> - ({r.user?.email})
                        {r.is_main && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">Responsável principal</span>
                        )}
                      </span>
                      {!hideResourceActions && (
                        <div className="flex gap-2">
                          {/* Botão para remover is_main se for o principal */}
                          {r.is_main && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              await fetch("/api/ticket-resources", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ user_id: r.user_id, ticket_id: ticket?.id, is_main: false })
                              });
                              fetchResources();
                            }}>
                              Remover responsável
                            </Button>
                          )}
                          {/* Botão para remover usuário do chamado */}
                          <Button size="sm" variant="destructive" onClick={async () => {
                            await fetch("/api/ticket-resources", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ user_id: r.user_id, ticket_id: ticket?.id })
                            });
                            fetchResources();
                          }}>
                            Remover usuário
                          </Button>
                          {/* Botão Encaminhar, só se não for is_main */}
                          {!r.is_main && (
                            <ForwardButton 
                              ticketId={ticket?.id} 
                              userId={r.user_id} 
                              userEmail={r.user?.email || ""}
                              userName={`${r.user?.first_name || ''} ${r.user?.last_name || ''}`.trim()}
                              ticket={ticket}
                              onSuccess={fetchResources}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
          
          {/* Dialog para editar data de encerramento estimada */}
          <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Alterar Data de Encerramento Estimada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data de Encerramento Estimada</label>
                  <Input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={updatePlannedEndDate}
                  disabled={updatingDate}
                >
                  {updatingDate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Dialog para vincular recurso */}
          <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Vincular Recurso ao Chamado</DialogTitle>
              </DialogHeader>
              <div className="mb-2">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  disabled={availableLoading}
                />
              </div>
              {!hideResourceActions && (
                <>
                  {availableLoading ? (
                    <div className="text-muted-foreground text-sm">Carregando usuários...</div>
                  ) : resourceError ? (
                    <div className="text-destructive text-sm">{resourceError}</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-muted-foreground text-sm italic">Nenhum usuário disponível para vínculo.</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Informações da paginação */}
                      {totalResourcePages > 1 && (
                        <div className="text-xs text-muted-foreground">
                          Mostrando {currentResources.length} de {totalResources} usuários
                        </div>
                      )}
                      
                      {/* Tabela */}
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Módulo</TableHead>
                              <TableHead className="w-[100px]">Ação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody style={{ minHeight: `${resourcesPerPage * 60}px` }}>
                            {currentResources.map(u => (
                              <TableRow key={u.id} className="h-[60px]">
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{u.first_name} {u.last_name}</span>
                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {u.user_functional_name || u.ticket_module ? (
                                    <span className="text-sm">
                                      {u.user_functional_name || u.ticket_module}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground italic">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={async () => {
                                    try {
                                      await fetch("/api/ticket-resources/link", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ ticket_id: ticket?.id, user_id: u.id })
                                      });
                                      setShowResourceDialog(false);
                                      fetchResources();
                                    } catch {
                                      setResourceError("Erro ao vincular recurso");
                                    }
                                  }}>
                                    Vincular
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Linhas vazias para manter altura fixa */}
                            {Array.from({ length: resourcesPerPage - currentResources.length }, (_, index) => (
                              <TableRow key={`empty-${index}`} className="h-[60px]">
                                <TableCell className="text-transparent">.</TableCell>
                                <TableCell className="text-transparent">.</TableCell>
                                <TableCell className="text-transparent">.</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Controles de paginação */}
                      {totalResourcePages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Página {currentResourcePage} de {totalResourcePages}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={goToPreviousResourcePage} 
                              disabled={currentResourcePage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" /> Anterior
                            </Button>
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(5, totalResourcePages) }, (_, i) => {
                                let pageNumber;
                                if (totalResourcePages <= 5) {
                                  pageNumber = i + 1;
                                } else if (currentResourcePage <= 3) {
                                  pageNumber = i + 1;
                                } else if (currentResourcePage >= totalResourcePages - 2) {
                                  pageNumber = totalResourcePages - 4 + i;
                                } else {
                                  pageNumber = currentResourcePage - 2 + i;
                                }
                                return (
                                  <Button
                                    key={pageNumber}
                                    variant={currentResourcePage === pageNumber ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToResourcePage(pageNumber)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNumber}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={goToNextResourcePage} 
                              disabled={currentResourcePage === totalResourcePages}
                            >
                              Próxima <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Fechar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* --- Fim recursos vinculados --- */}
        </TabsContent>
        <TabsContent value="messages">
          <div className="space-y-4">
            {/* Botões de filtro - discretos no topo - só para usuários não-clientes */}
            {currentUser && !currentUser.is_client && (
              <div className="flex items-center justify-between gap-2 mb-4">
                {/* Mostrar total de mensagens após filtros (se diferentes do total) */}
                {allMessages.length !== filteredMessages.length && (
                  <div className="text-xs text-muted-foreground">
                    Mostrando {filteredMessages.length} de {allMessages.length} mensagens
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant={hideSystemMessages ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHideSystemMessages(!hideSystemMessages)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    title={hideSystemMessages ? "Mostrar mensagens do sistema" : "Ocultar mensagens do sistema"}
                  >
                    <EyeOff className="w-3 h-3 mr-1" />
                    {hideSystemMessages ? "Mostrar Sistema" : "Ocultar Sistema"}
                  </Button>
                  <Button
                    variant={hidePrivateMessages ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHidePrivateMessages(!hidePrivateMessages)}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    title={hidePrivateMessages ? "Mostrar mensagens privadas" : "Ocultar mensagens privadas"}
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {hidePrivateMessages ? "Mostrar Privadas" : "Ocultar Privadas"}
                  </Button>
                </div>
              </div>
            )}
            {messagesLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando mensagens...</span>
              </div>
            ) : (
              <>
                {/* Controles de paginação - Topo */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} - Mostrando {currentMessages.length} de {totalMessages} mensagens
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </Button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                        Próxima <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {/* Lista de mensagens da página atual */}
                {currentMessages.length === 0 && (
                  <div className="text-muted-foreground text-center py-8">Nenhuma mensagem encontrada para este chamado.</div>
                )}
                {currentMessages.map((msg) => (
                  <MessageCard 
                    key={msg.id} 
                    msg={msg} 
                    currentUser={currentUser ? {
                      id: currentUser.id,
                      is_client: currentUser.is_client,
                      role: currentUser.role
                    } : undefined} 
                    onMessageUpdated={async () => { 
                      setMessagesLoaded(false); 
                      await refreshMessages();
                      // Atualiza recursos também em caso de mudanças
                      await fetchResources();
                    }} 
                  />
                ))}
                {/* Controles de paginação - Bottom */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                      <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                        Próxima <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <Separator className="my-4" />
                {/* Área de nova mensagem */}
                <MessageForm 
                  ticket={ticket} 
                  onMessageSent={async () => { 
                    setMessagesLoaded(false); 
                    await refreshMessages();
                    // Força uma nova busca dos recursos para atualizar possíveis vinculações
                    await fetchResources();
                  }} 
                  statusOptions={statusOptions} 
                />
              </>
            )}
          </div>
        </TabsContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={editingField !== null} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar {editingField === 'category' ? 'Categoria' : editingField === 'module' ? 'Módulo' : 'Prioridade'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {optionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Carregando opções...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Selecione {editingField === 'category' ? 'a categoria' : editingField === 'module' ? 'o módulo' : 'a prioridade'}
                </label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Selecione ${editingField === 'category' ? 'uma categoria' : editingField === 'module' ? 'um módulo' : 'uma prioridade'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {editingField === 'category' && categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {editingField === 'module' && modules.map((moduleItem) => (
                      <SelectItem key={moduleItem.id} value={moduleItem.id}>
                        {moduleItem.name}
                      </SelectItem>
                    ))}
                    {editingField === 'priority' && priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={saveEdit} 
              disabled={!selectedValue || updatingField || optionsLoading}
            >
              {updatingField ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para ações do cliente */}
      <Dialog open={!!confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmOpen?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Confirme a ação e, se quiser, informe um motivo/observação para registrar no histórico e na notificação.
            </div>
            <Input
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant={confirmOpen?.action === "pause" ? "destructive" : "colored2"}
              onClick={() => confirmOpen && doChangeStatus(confirmOpen.action)}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
