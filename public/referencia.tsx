"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpenText, Calendar, Clock, File, Info, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlocateResourceButton } from "@/components/AlocateUserTicket";

interface TicketDetailProps {
  ticket: {
    id: string;
    ticketExtId: number;
    ticketTitle: string;
    ticketDesc: string;
    ticketStat: string;
    ticketModu: string;
    ticketType: string;
    ticketCat: string;
    ticketPrio: string;
    createdAt: string;
    ticketHours?: string;
    partner: { partnerDesc: string };
    project: { projectName: string };
    createdByUser: { name: string };
    attachments?: {
      id: string;
      name: string;
      path: string;
    }[];
    resources: [
    {
      user: {
        id: string,
        name: string
      }
    }
  ];
  };
  messages: {
      id: string;
      msgExtId: number;
      msgBody: string;
      msgHours?: string;
      msgPrivate: boolean;
      msgStatus: string;
      createdAt: string;
      createdBy: string;
      user: {
        name: string;
        partner: string;
      };
      attachments: {
        id: string;
        name: string;
        path: string;
      }[];
    }[];
  }

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<TicketDetailProps["ticket"] | null>(null);
  const [allMessages, setAllMessages] = useState<TicketDetailProps["messages"]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [messageHours, setMessageHours] = useState("");
  const [isPartnerUser, setIsPartnerUser] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 10;

  // Calcular mensagens da página atual
  const totalMessages = allMessages.length;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = allMessages.slice(startIndex, endIndex);

  const fileNameDisplay = selectedFiles.length > 0 ? (
    <div className="mb-2 text-sm text-muted-foreground">
      Arquivos selecionados:{" "}
      <span className="font-medium">
        {selectedFiles.map((file) => file.name).join(", ")}
      </span>
    </div>
  ) : null;

  // Calcular total de horas das mensagens
  const totalHours = allMessages.reduce((total, msg) => {
    return total + (msg.msgHours ? parseFloat(msg.msgHours.toString()) : 0);
  }, 0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ticketRes, userRes] = await Promise.all([
          fetch(`/api/tickets/${ticketId}`),
          fetch("/api/auth/get-session"),
        ]);

        const ticketData = await ticketRes.json();
        const session = await userRes.json();

        setTicket(ticketData);
        // Ordenar mensagens da mais recente para a mais antiga
        const sortedMessages = (ticketData.message || []).sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllMessages(sortedMessages);
        setIsPartnerUser(session?.user?.partner === true);
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) fetchData();
  }, [ticketId]);

  async function createMessage() {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          msgBody: newMessage, 
          msgPrivate: isPrivate,
          msgHours: messageHours ? parseFloat(messageHours) : null, 
          msgStatus: selectedStatus || undefined,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar mensagem");
      const createdMsg = await res.json();

      if (!isPartnerUser && selectedStatus !== ticket?.ticketStat) {
        await fetch(`/api/tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketStat: selectedStatus }),
        });
      }

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("mediaFile", file);
        });
        formData.append("messageId", createdMsg.id);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Erro no upload dos anexos");
      }

      setNewMessage("");
      setSelectedFiles([]);
      setMessageHours("");
      setSelectedStatus("");

      // Recarregar dados e ir para a primeira página (onde está a nova mensagem mais recente)
      const updated = await fetch(`/api/tickets/${ticketId}`);
      const data = await updated.json();
      setTicket(data);
      
      // Ordenar mensagens da mais recente para a mais antiga
      const sortedMessages = (data.message || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllMessages(sortedMessages);
      
      // Ir para a primeira página (onde está a nova mensagem mais recente)
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    }
  }

  async function createAttachment(): Promise<Response | null> {
    if (selectedFiles.length === 0) return null;

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("mediaFile", file);
      });
      formData.append("messageId", newMessage);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSelectedFiles([]);
      }

      return res;
    } catch (e) {
      console.error("Erro ao fazer upload de arquivos", e);
      return null;
    }
  }

  // Funções de navegação da paginação
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

  if (loading) return <div>Carregando...</div>;
  if (!ticket) return <div>Ticket não encontrado.</div>;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="messages">Mensagens ({totalMessages})</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
            <div className="text-xl font-semibold flex-1">
              {String(ticket.ticketExtId).padStart(5, "0")} - {ticket.ticketTitle}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 text-md text-muted-foreground">
              <div className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
              </div>
              <div className="inline-flex items-center gap-1 italic text-md">
                <UserCircle className="w-4 h-4" />
                {ticket.createdByUser?.name || "Desconhecido"}
              </div>
              <Badge variant="default" className="text-md">{ticket.ticketStat}</Badge>
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
            {ticket.ticketDesc}
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
                <span>{ticket.ticketType}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Categoria</span>
                <span>{ticket.ticketCat}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Módulo</span>
                <span>{ticket.ticketModu}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Prioridade</span>
                <span>{ticket.ticketPrio}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Projeto</span>
                <span>{ticket.project.projectName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs font-medium">Parceiro</span>
                <span>{ticket.partner.partnerDesc}</span>
              </div>
            </div>
        </CardContent>

        <CardContent>
          <Separator className="my-4 mb-4" />

          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium">
              <Info className="w-4 h-4" />
              Recursos Alocados
            </div>
            <AlocateResourceButton ticketId={ticket.id} />
          </div>

          {ticket.resources?.length > 0 ? (
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              {ticket.resources.map((res) => (
                <li key={res.user.id} className="text-foreground">
                  • {res.user.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Nenhum recurso alocado.</p>
          )}

          <Separator className="my-4 mb-4" />

          <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
            <File className="w-4 h-4" />
            Anexos do Chamado
          </div>
            
            {/* Função para coletar todos os anexos do ticket e mensagens */}
            {(() => {
              // Anexos diretos do ticket
              const ticketAttachments = ticket.attachments || [];
              
              // Anexos das mensagens
              const messageAttachments = allMessages.reduce((acc: any[], msg) => {
                if (msg.attachments && msg.attachments.length > 0) {
                  const attachmentsWithMessageInfo = msg.attachments.map(attachment => ({
                    ...attachment,
                    messageId: msg.id,
                    messageDate: msg.createdAt,
                    userName: msg.user?.name || "Usuário desconhecido"
                  }));
                  return [...acc, ...attachmentsWithMessageInfo];
                }
                return acc;
              }, []);

              // Todos os anexos combinados
              const allAttachments = [
                ...ticketAttachments.map(att => ({ ...att, source: 'ticket' })),
                ...messageAttachments.map(att => ({ ...att, source: 'message' }))
              ];

              if (allAttachments.length === 0) {
                return (
                  <div className="text-sm text-muted-foreground italic">
                    Nenhum anexo encontrado neste chamado.
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Anexos diretos do ticket */}
                  {ticketAttachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Anexos do Ticket:</h4>
                      <ul className="list-none space-y-1 text-sm ml-4">
                        {ticketAttachments.map((file: { id: string; name: string; path: string }) => (
                          <li key={file.id}>
                            <a
                              href={`/api/${file.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:underline inline-flex items-center gap-2"
                            >
                              <File className="w-4 h-4" />
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Anexos das mensagens */}
                  {messageAttachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Anexos das Mensagens:</h4>
                      <ul className="list-none space-y-2 text-sm ml-4">
                        {messageAttachments.map((file: { 
                          id: string; 
                          name: string; 
                          path: string; 
                          messageDate: string; 
                          userName: string;
                        }) => (
                          <li key={file.id} className="border-l-2 border-gray-300 pl-3">
                            <div className="flex flex-col gap-1">
                              <a
                                href={`/api/${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:underline inline-flex items-center gap-2"
                              >
                                <File className="w-4 h-4" />
                                {file.name}
                              </a>
                              <div className="text-xs text-muted-foreground">
                                Por: {file.userName} • {new Date(file.messageDate).toLocaleString("pt-BR")}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Lista de mensagens da página atual */}
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`p-4 rounded border space-y-2 ${
                msg.user?.partner
                  ? "border-l-4 border-l-blue-600"
                  : "border-l-4 border-l-amber-500"
              }`}>
              {/* Cabeçalho da mensagem */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {/* Linha 1: status + privado */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="w-fit">
                    {msg.msgStatus || "Sem status"}
                  </Badge>
                  {msg.msgPrivate && (
                    <Badge variant="destructive" className="w-fit">
                      Privado
                    </Badge>
                  )}
                    <Badge
                      variant="outline"
                      className={`w-fit text-normal ${
                        msg.user?.partner
                          ? "bg-blue-600/25 text-white"
                          : "bg-amber-500/25 text-white"
                      }`}
                    >
                      {msg.user?.partner ? "Parceiro" : "Numen"}
                    </Badge>
                </div>

                {/* Linha 2: metadados */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(msg.createdAt).toLocaleString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-1 italic">
                    <UserCircle className="w-4 h-4" />
                    {msg.user?.name || "Usuário desconhecido"}
                  </div>
                  {msg.msgHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4"/>
                      Apontadas {msg.msgHours} hora(s)
                    </div>
                  )}
                </div>
              </div>

              {/* Corpo da mensagem */}
              <div className="text-sm whitespace-pre-wrap">{msg.msgBody}</div>

              {/* Anexos */}
              {msg.attachments?.length > 0 && (
                <div className="pt-2 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Anexos:</div>
                  <ul className=" list-inside text-sm text-blue-400 space-y-0.5 list-none">
                    {msg.attachments.map((file: { id: string; name: string; path: string }) => (
                      <li key={file.id}>
                        <a
                          href={`/api/${file.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <Separator className="my-4" />
          <div>
            {fileNameDisplay}
          </div>
            {!isPartnerUser && (
              <div className="w-full">
                <Card className="w-full py-2 rounded-md">
                  <CardContent className="flex flex-col md:flex-row justify-start items-center gap-6 py-0 px-6">

                    {/* Switch de privacidade */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="privateSwitch" className="text-sm text-muted-foreground font-medium">
                        Mensagem Privada
                      </label>
                      <Switch
                        id="privateSwitch"
                        checked={isPrivate}
                        onCheckedChange={(checked) => setIsPrivate(checked)}
                      />
                    </div>

                    {/* Campo de horas */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="hoursInput" className="text-sm text-muted-foreground font-medium">
                        Horas Apontadas
                      </label>
                      <Input
                        id="hoursInput"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={messageHours}
                        onChange={(e) => setMessageHours(e.target.value)}
                        className="w-20"
                      />
                    </div>

                    {/* Campo de status */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="statusSelect" className="text-sm text-muted-foreground font-medium">
                        Status
                      </label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Selecionar status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AGUARDANDO_ATENDIMENTO">Aguardando Atendimento</SelectItem>
                            <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                            <SelectItem value="AGUARDANDO_RETORNO_CLIENTE">Aguardando Retorno do Cliente</SelectItem>
                            <SelectItem value="EM_DESENVOLVIMENTO_FABRICA">Em Desenvolvimento na Fábrica</SelectItem>
                            <SelectItem value="AGUARDANDO_APROVACAO_DE_HORAS">Aguardando Aprovação de Horas</SelectItem>
                            <SelectItem value="LIBERADO_PARA_TESTES">Liberado para Testes</SelectItem>
                            <SelectItem value="AGUARDANDO_TRANSPORTE_PRD">Aguardando Transporte para PRD</SelectItem>
                            <SelectItem value="ENCAMINHADO_PARA_ENCERRAMENTO">Encaminhado para Encerramento</SelectItem>
                            <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                            <SelectItem value="PLANEJADO">Planejado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Área de nova mensagem */}
            <div className="space-y-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                  }}
                  className="text-sm"
                />
                
                <Button onClick={createMessage} disabled={!newMessage.trim()}>
                  Enviar Mensagem
                </Button>
              </div>
            </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}