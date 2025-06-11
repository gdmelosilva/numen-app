"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Ticket } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpenText, Calendar, Clock, Info, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Mensagens e paginação
  type Message = {
    id: string;
    msgStatus?: string;
    msgPrivate?: boolean;
    msgHours?: number | string;
    msgBody?: string;
    createdAt?: string;
    user?: { name?: string };
    attachments?: { id: string; name: string; path: string }[];
  };
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 10;
//   const [newMessage, setNewMessage] = useState("");
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [isPrivate, setIsPrivate] = useState(false);
//   const [messageHours, setMessageHours] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("");

  // Calcular mensagens da página atual
  const totalMessages = allMessages.length;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = allMessages.slice(startIndex, endIndex);

  // Calcular total de horas das mensagens
  const totalHours = allMessages.reduce((total, msg) => {
    return total + (msg.msgHours ? parseFloat(msg.msgHours.toString()) : 0);
  }, 0);

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
        // TODO: buscar mensagens do chamado (mock vazio por enquanto)
        setAllMessages([]); // Substitua por fetch real se houver endpoint
      } catch {
        setError("Erro ao buscar detalhes do chamado");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTicket();
  }, [id]);

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

  return (

    <Tabs defaultValue="details" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="messages">Mensagens ({totalMessages})</TabsTrigger>
      </TabsList>
        <Card>
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
              <Badge variant="default" className="text-md">{(typeof ticket.status === 'object' && ticket.status && 'name' in ticket.status) ? ticket.status.name : (typeof ticket.status_id === 'string' || typeof ticket.status_id === 'number' ? ticket.status_id : '-')}</Badge>
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
            <div key={msg.id} className="p-4 rounded border space-y-2 border-l-4 border-l-blue-600">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="w-fit">{msg.msgStatus || "Sem status"}</Badge>
                  {msg.msgPrivate && <Badge variant="destructive" className="w-fit">Privado</Badge>}
                  <Badge variant="outline" className="w-fit text-normal bg-blue-600/25 text-white">Parceiro</Badge>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString("pt-BR") : "-"}
                  </div>
                  <div className="flex items-center gap-1 italic">
                    <UserCircle className="w-4 h-4" />
                    {msg.user?.name || "Usuário desconhecido"}
                  </div>
                  {msg.msgHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Apontadas {msg.msgHours} hora(s)
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{msg.msgBody}</div>
              {(msg.attachments && msg.attachments.length > 0) && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Anexos:</div>
                  <ul className="list-inside text-sm text-blue-400 space-y-0.5 list-none">
                    {(msg.attachments ?? []).map((file: { id: string; name: string; path: string }) => (
                      <li key={file.id}>
                        <a href={`/api/${file.path}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
        </div>
      </TabsContent>
          </Card>
    </Tabs>
  );
}
