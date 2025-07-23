"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Ticket } from "@/types/tickets";
// import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookOpenText, Calendar, Info, UserCircle, ChevronLeft, ChevronRight, File, Edit3, EyeOff, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";
import React from "react";
import MessageForm from "@/components/message-form";
import { MessageCard } from "@/components/message-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/components/user-context";
import type { UserWithModule } from "@/types/users";
import { ForwardButton } from "@/components/ForwardButton";
// import { useTicketStatuses } from "@/hooks/useTicketStatuses";

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

  // Corrige mapeamento das mensagens vindas do backend para o formato esperado pelo frontend
  const mapMessageBackendToFrontend = (msg: Record<string, unknown>): Message => ({
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
  });

  // Calcular total de horas das mensagens
  // const totalHours = allMessages.reduce((total, msg) => {
  //   return total + (msg.msgHours ? parseFloat(msg.msgHours.toString()) : 0);
  // }, 0);

  // Busca apenas as mensagens do ticket
  const refreshMessages = async () => {
    if (!ticket) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?ticket_id=${ticket.id}`);
      if (!res.ok) throw new Error("Erro ao buscar mensagens");
      const msgs = await res.json();
      const mappedMessages = Array.isArray(msgs) ? msgs.map(mapMessageBackendToFrontend) : [];
      setAllMessages(mappedMessages);
      setMessagesLoaded(true);
      
      // Atualiza as horas estimadas quando as mensagens são atualizadas
      // A função fetchEstimatedHours já considera a filtragem de mensagens privadas
      await fetchEstimatedHours();
    } catch {
      setAllMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

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

  // Paginação
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
      <TabsList className="mb-4">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="messages">
          {totalMessages > 0 ? `Mensagens (${totalMessages})` : "Mensagens"}
        </TabsTrigger>
      </TabsList>
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
                <span className="text-muted-foreground text-xs font-medium">Tipo</span>
                <span>{(typeof ticket.type === 'object' && ticket.type && 'name' in ticket.type) ? ticket.type.name : (typeof ticket.type_id === 'string' || typeof ticket.type_id === 'number' ? ticket.type_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Categoria</span>
                <span>{(typeof ticket.category === 'object' && ticket.category && 'name' in ticket.category) ? ticket.category.name : (typeof ticket.category_id === 'string' || typeof ticket.category_id === 'number' ? ticket.category_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Módulo</span>
                <span>{(typeof ticket.module === 'object' && ticket.module && 'name' in ticket.module) ? ticket.module.name : (typeof ticket.module_id === 'string' || typeof ticket.module_id === 'number' ? ticket.module_id : '-')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Prioridade</span>
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
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  </div>
                </div>
              )}
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
            {resourcesLoading ? (
              <div className="text-muted-foreground text-sm">Carregando recursos...</div>
            ) : resources.length === 0 ? (
              <div className="text-muted-foreground text-sm italic">Nenhum recurso vinculado a este chamado.</div>
            ) : (
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
                            onSuccess={fetchResources}
                          />
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
            <DialogContent className="max-w-lg">
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
                  ) : availableUsers.length === 0 ? (
                    <div className="text-muted-foreground text-sm italic">Nenhum usuário disponível para vínculo.</div>
                  ) : (
                    <ul className="divide-y divide-muted-foreground/10">
                      {availableUsers.filter(u =>
                        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchUser.toLowerCase())
                      ).map(u => (
                        <li key={u.id} className="py-2 flex items-center justify-between">
                          <span>
                            {u.first_name} {u.last_name} ({u.email})
                            {u.user_functional_name || u.ticket_module ? (
                              <span className="ml-2 text-xs text-muted-foreground italic">
                                - Módulo: {u.user_functional_name || u.ticket_module}
                              </span>
                            ) : null}
                          </span>
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
                          }}>Vincular</Button>
                        </li>
                      ))}
                    </ul>
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
                  <MessageCard key={msg.id} msg={msg} />
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
                <MessageForm ticket={ticket} onMessageSent={async () => { setMessagesLoaded(false); await refreshMessages(); }} statusOptions={statusOptions} />
              </>
            )}
          </div>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
