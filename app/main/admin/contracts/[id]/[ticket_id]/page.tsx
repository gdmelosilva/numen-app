"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Ticket } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookOpenText, Calendar, Info, UserCircle, ChevronLeft, ChevronRight, File } from "lucide-react";
import { Loader2 } from "lucide-react";
import React from "react";
import MessageForm from "@/components/message-form";
import { MessageCard } from "@/components/message-card";
import { useUserContext } from "@/components/user-context";

export default function TicketDetailsPage() {
  const params = useParams();
  // Corrige para pegar o ticket_id do param correto
  // Para rotas aninhadas, o parâmetro pode ser chamado apenas 'id'
  const ticket_id = params.ticket_id || params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useUserContext();
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
  const [ticketAttachments, setTicketAttachments] = useState<Array<{
    id: string;
    name: string;
    path: string;
    message_id?: string | null;
    created_at?: string;
    user_name?: string;
  }>>([]);

  // Corrige mapeamento das mensagens vindas do backend para o formato esperado pelo frontend
  const mapMessageBackendToFrontend = React.useCallback((msg: Record<string, unknown>): Message => ({
    id: String(msg.id),
    ticket_id: typeof msg.ticket_id === 'string' ? msg.ticket_id : undefined,
    msgStatus: msg.status_id ? String(msg.status_id) : undefined,
    msgPrivate: Boolean(msg.is_private),
    msgHours: typeof msg.hours === 'number' || typeof msg.hours === 'string' ? msg.hours : undefined,
    msgBody: typeof msg.body === 'string' ? msg.body : '',
    createdAt: typeof msg.created_at === 'string' ? msg.created_at : '',
    user: typeof msg.user === 'object' && msg.user !== null ? (msg.user as { name?: string; is_client?: boolean }) : { name: '' },
    attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
    is_system: Boolean(msg.is_system), // Mapeia is_system
    msg_ref: typeof msg.msg_ref === 'string' ? msg.msg_ref : undefined,
    ref_msg_id: typeof msg.ref_msg_id === 'string' ? msg.ref_msg_id : undefined,
  }), []);

  // Calcular total de horas das mensagens
  const totalHours = allMessages.reduce((total, msg) => {
    return total + (msg.msgHours ? parseFloat(msg.msgHours.toString()) : 0);
  }, 0);

  // Fetch messages (agora busca do endpoint real)
  const refreshMessages = async () => {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/messages?ticket_id=${ticket.id}`);
      if (!res.ok) throw new Error("Erro ao buscar mensagens");
      const msgs = await res.json();
      setAllMessages(Array.isArray(msgs) ? msgs.map(mapMessageBackendToFrontend) : []);
    } catch {
      setAllMessages([]);
    }
  }

  useEffect(() => {
    async function fetchTicketAndMessages() {
      setLoading(true);
      setError(null);
      try {
        // Busca dados do ticket pelo novo endpoint
        const response = await fetch(`/api/smartcare/tickets/${ticket_id}`);
        const data = await response.json();
        if (!response.ok || !data || !data.data) {
          throw new Error("Chamado não encontrado");
        }
        const ticketData = data.data;
        setTicket(ticketData);
        // Busca anexos do ticket diretamente
        if (ticketData?.id) {
          const attRes = await fetch(`/api/attachment?ticket_id=${ticketData.id}`);
          if (attRes.ok) {
            const atts = await attRes.json();
            setTicketAttachments(Array.isArray(atts) ? atts : []);
          } else {
            setTicketAttachments([]);
          }
        } else {
          setTicketAttachments([]);
        }
        // Busca mensagens reais do ticket
        if (ticketData?.id) {
          const res = await fetch(`/api/messages?ticket_id=${ticketData.id}`);
          if (res.ok) {
            const msgs = await res.json();
            setAllMessages(Array.isArray(msgs) ? msgs.map(mapMessageBackendToFrontend) : []);
          } else {
            setAllMessages([]);
          }
        } else {
          setAllMessages([]);
        }
      } catch {
        setError("Erro ao buscar detalhes do chamado");
        setAllMessages([]);
        setTicketAttachments([]);
      } finally {
        setLoading(false);
      }
    }
    if (ticket_id) fetchTicketAndMessages();
  }, [ticket_id, mapMessageBackendToFrontend]);

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
  // Paginação baseada nas mensagens ordenadas
  const totalMessages = sortedMessages.length;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = sortedMessages.slice(startIndex, endIndex);

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

  return (
    <Tabs defaultValue="details" className="w-full h-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="messages">Mensagens ({totalMessages})</TabsTrigger>
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
                  {typeof ticket.created_by_user === "object" && ticket.created_by_user !== null && 'name' in ticket.created_by_user
                    ? ticket.created_by_user.name
                    : (typeof ticket.created_by === 'string' ? ticket.created_by : '-')}
                </div>
                <ColoredBadge 
                  type="ticket_status" 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={ticket.status as any}
                  className="text-md"
                />
              </div>
              <div className="flex flex-col items-end align-middle justify-center">
                <span className="text-muted-foreground text-xs font-medium mb-1"></span>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {totalHours > 0 ? `${totalHours.toFixed(1)}h` : "0h"}
                </Badge>
              </div>
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
            </div>
            <Separator className="my-4 mb-4" />
            <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
              <File className="w-4 h-4" />
              Anexos do Chamado
            </div>
            {/* Exibição de todos os anexos do ticket (com ou sem message_id) */}
            {(() => {
              // Junta todos os anexos do ticket (com ou sem message_id)
              const allTicketAttachments: {
                id: string;
                name: string;
                path: string;
                messageId?: string;
                messageDate: string;
                userName: string;
              }[] = [];

              // Anexos diretos do ticket (todos de ticketAttachments)
              if (Array.isArray(ticketAttachments)) {
                const directAttachments = ticketAttachments
                  .filter(att => !att.message_id) // só os que não têm message_id
                  .map(att => ({
                    id: att.id,
                    name: att.name,
                    path: att.path,
                    messageId: undefined,
                    messageDate: att.created_at || (ticket?.created_at || ''),
                    userName: att.user_name || (ticket && ticket.created_by_user && typeof ticket.created_by_user === 'object' && 'name' in ticket.created_by_user
                      ? ticket.created_by_user.name
                      : (typeof ticket?.created_by === 'string' ? ticket.created_by : 'Usuário desconhecido'))
                  }));
                allTicketAttachments.push(...directAttachments);
              }

              // Anexos das mensagens (com message_id)
              allMessages.forEach(msg => {
                if (msg.attachments && msg.attachments.length > 0) {
                  const msgAttachments = msg.attachments.map(att => ({
                    ...att,
                    messageId: msg.id,
                    messageDate: msg.createdAt || '',
                    userName: msg.user?.name || 'Usuário desconhecido'
                  }));
                  allTicketAttachments.push(...msgAttachments);
                }
              });

              if (allTicketAttachments.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground italic">
                    Nenhum anexo encontrado neste chamado.
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Anexos do Chamado:</h4>
                    <ul className="list-none space-y-2 text-sm ml-4">
                      {allTicketAttachments.map((file) => (
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
                              {file.messageId ? ' (anexo de mensagem)' : ' (anexo do chamado)'}
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
        </TabsContent>
        <TabsContent value="messages">
          <div className="space-y-4">
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
                onMessageUpdated={refreshMessages} 
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
            <MessageForm ticket={ticket} onMessageSent={refreshMessages} statusOptions={statusOptions} />
          </div>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
