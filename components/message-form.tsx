import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Ticket } from "@/types/tickets";
import TicketHourDialogButton, { TicketHourData } from "./ticket-hour-dialog-button";
import { useCanUserLogHours, useCanUserSendMessage, useUserInContract } from "@/hooks/useCanUserLog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isTicketFinalized, getTicketFinalizedMessage } from "@/lib/ticket-status";

interface StatusOption {
  value: string;
  label: string;
}

interface MessageFormProps {
  ticket: Ticket;
  onMessageSent: () => Promise<void>;
  statusOptions?: StatusOption[];
}

const MessageForm: React.FC<MessageFormProps> = ({ ticket, onMessageSent, statusOptions = [] }) => {
  const { user } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Verificar se o ticket está finalizado
  const isFinalized = isTicketFinalized(ticket);

  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentType, setAttachmentType] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  // Garante que o valor inicial de selectedStatus é sempre o status do ticket (string)
  const initialStatusId = ticket.status_id !== undefined && ticket.status_id !== null ? String(ticket.status_id) : "";
  const [selectedStatus, setSelectedStatus] = useState(initialStatusId);
  const [sending, setSending] = useState(false);
  const [ticketHourData, setTicketHourData] = useState<TicketHourData | null>(null);
  const [statusList, setStatusList] = useState<StatusOption[]>(statusOptions);
  const [statusLoading, setStatusLoading] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");

  // Verificar se é usuário funcional ou cliente - ocultar status e apontamento de horas
  const isFunctionalOrClient = user?.is_client === true;// Hooks de validação
  const { userInContract, loading: contractLoading } = useUserInContract(ticket.project_id);
  const { canSend, reason: messageReason } = useCanUserSendMessage(ticket.project_id, userInContract ?? undefined, contractLoading, ticket.partner_id);
  const { canLog, reason: hoursReason, loading: hoursLoading } = useCanUserLogHours(ticket.project_id);
  // Loading geral das validações
  const validationsLoading = contractLoading || hoursLoading;

  async function handleSend() {
    if (!newMessage.trim()) return;

    // Verificar se o ticket está finalizado
    if (isFinalized) {
      toast.error(getTicketFinalizedMessage());
      return;
    }

    // Validações de negócio antes de enviar
    if (!canSend) {
      toast.error(`Não é possível enviar mensagem: ${messageReason}`);
      return;
    }
    if (ticketHourData && !canLog) {
      toast.error(`Não é possível apontar horas: ${hoursReason}`);
      return;
    }
    // Para usuários funcionais e clientes, não permitir apontamento de horas
    if (ticketHourData && isFunctionalOrClient) {
      toast.error("Usuários funcionais e clientes não podem apontar horas");
      return;
    }

    // Validar tipo de anexo se houver arquivos
    if (selectedFiles.length > 0 && !attachmentType) {
      toast.error("Selecione o tipo do anexo antes de enviar");
      return;
    }

    // Validar estimativa de horas se tipo for "Especificação"
    if (selectedFiles.length > 0 && attachmentType === "Especificação" && (!estimatedHours || estimatedHours <= 0)) {
      toast.error("Informe a estimativa de horas para especificações");
      return;
    }

    // Determina o status_id a ser enviado
    let statusIdToSend: number | null = null;
    const ticketStatusId = ticket.status_id !== undefined && ticket.status_id !== null ? String(ticket.status_id) : "";
    if (!selectedStatus || selectedStatus === ticketStatusId) {
      statusIdToSend = ticket.status_id !== undefined && ticket.status_id !== null ? Number(ticket.status_id) : null;
    } else {
      statusIdToSend = Number(selectedStatus);
    }

    setSending(true);
    try {
      // Verificar se o status foi alterado antes de enviar a mensagem
      const currentTicketStatusId = ticket.status_id !== undefined && ticket.status_id !== null ? Number(ticket.status_id) : null;
      const willUpdateStatus = statusIdToSend !== null && statusIdToSend !== currentTicketStatusId;

      // Preparar dados da mensagem
      const messageData: {
        body: string;
        is_private: boolean;
        status_id: number | null;
        ticket_id: string;
        hours?: number;
      } = {
        body: newMessage,
        is_private: isPrivate,
        status_id: statusIdToSend,
        ticket_id: ticket.id,
      };

      // Adicionar horas estimadas se for especificação
      if (attachmentType === "Especificação" && estimatedHours && estimatedHours > 0) {
        messageData.hours = Number(estimatedHours);
      }

      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Erro ao criar mensagem");
      }
      
      const createdMsg = await res.json();

      // Se o status foi alterado, atualizar o ticket
      if (willUpdateStatus) {
        const ticketUpdateRes = await fetch(`/api/tickets`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: ticket.id,
            status_id: statusIdToSend,
          }),
        });

        if (!ticketUpdateRes.ok) {
          const ticketError = await ticketUpdateRes.json();
          throw new Error(`Erro ao atualizar status do ticket: ${ticketError.error ?? 'Erro desconhecido'}`);
        }
      }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("messageId", createdMsg.id);
          if (attachmentType) formData.append("att_type", attachmentType);
          const uploadRes = await fetch("/api/attachment", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) throw new Error("Erro no upload dos anexos");
        }
      }// Se houver dados de apontamento, faz a requisição para /api/ticket-hours
      // Não permitir apontamento para usuários funcionais e clientes
      if (ticketHourData && user?.id && !isFunctionalOrClient) {
        // Monta timestamps completos para appoint_start e appoint_end
        const appointDate = ticketHourData.appointDate;
        const appointStart = appointDate && ticketHourData.appointStart
          ? `${appointDate}T${ticketHourData.appointStart}:00`
          : null;
        const appointEnd = appointDate && ticketHourData.appointEnd
          ? `${appointDate}T${ticketHourData.appointEnd}:00`
          : null;
          const hoursRes = await fetch("/api/ticket-hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: ticket.project_id,
            ticket_id: ticket.id,
            message_id: createdMsg.id,
            user_id: user.id, // Usar o usuário atual, não o criador do ticket
            minutes: ticketHourData.minutes,
            appoint_date: appointDate,
            appoint_start: appointStart,
            appoint_end: appointEnd,
          }),
        });

        if (!hoursRes.ok) {
          const hoursError = await hoursRes.json();
          throw new Error(`Erro ao apontar horas: ${hoursError.error ?? 'Erro desconhecido'}`);
        }
      }      setNewMessage("");
      setSelectedFiles([]);
      setAttachmentType("");
      setSelectedStatus("");
      setTicketHourData(null);
      setEstimatedHours("");
      toast.success("Mensagem enviada com sucesso!");
      await onMessageSent();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Erro ao enviar mensagem';
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  }

  async function fetchStatusOptions() {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/options?type=ticket_status");
      if (!res.ok) throw new Error("Erro ao buscar status");
      const data = await res.json();
      if (Array.isArray(data)) {
        setStatusList(data.map((s: { id: string | number; name: string }) => ({ value: String(s.id), label: s.name })));
      }
    } catch {
      setStatusList([]);
    } finally {
      setStatusLoading(false);
    }
  }
  return (
    <div className="w-full space-y-2 mt-4">
      {/* Loading das validações */}
      {validationsLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-3" />
            <span className="text-sm text-blue-700">Verificando permissões...</span>
          </div>
        </div>
      )}

      {/* Avisos de validação */}
      {!validationsLoading && !canSend && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Não é possível enviar mensagens
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{messageReason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!validationsLoading && !canLog && ticketHourData && !isFunctionalOrClient && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Não é possível apontar horas
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{hoursReason}</p>
                <p className="mt-1 text-xs">As horas registradas serão removidas automaticamente.</p>
              </div>
            </div>
          </div>        </div>
      )}

      <Card className="w-full py-2 rounded-md"><CardContent className="flex flex-col md:flex-row justify-start items-center gap-6 py-0 px-6">
          {validationsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando permissões...</span>
            </div>
          )}

          {/* Checkbox de mensagem privada - apenas para usuários não-clientes */}
          {!user?.is_client && (
            <div className="flex items-center gap-2">
              <label htmlFor="privateSwitch" className="text-sm text-muted-foreground font-medium">
                Mensagem Privada
              </label>
              <Switch 
                id="privateSwitch" 
                checked={isPrivate} 
                onCheckedChange={setIsPrivate}
                disabled={validationsLoading}
              />
            </div>
          )}

          {/* Status selection - ocultar para usuários funcionais e clientes */}
          {!isFunctionalOrClient && (
            <div className="flex items-center gap-2 min-w-60">
              <label htmlFor="statusSelect" className="text-sm text-muted-foreground font-medium">
                Status
              </label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                onOpenChange={(open) => { if (open) fetchStatusOptions(); }}
                disabled={validationsLoading || isFinalized}
              >
                <SelectTrigger className="min-w-60">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {statusLoading ? (
                    <div className="px-2 py-1 text-xs text-muted-foreground">Carregando...</div>
                  ) : statusList.length > 0 ? (
                    statusList.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-xs text-muted-foreground">Nenhum status encontrado</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hour tracking - ocultar para usuários funcionais e clientes */}
          {!isFunctionalOrClient && (
            <>
              <TicketHourDialogButton 
                onSave={setTicketHourData} 
                initialData={ticketHourData}
                disabled={isFinalized}
              />
              {!canLog && (
                <span className="text-xs text-red-600 bg-red-100 rounded px-2 py-1">
                  Apontamento bloqueado
                </span>
              )}
              {isFinalized && (
                <span className="text-xs text-orange-600 bg-orange-100 rounded px-2 py-1">
                  Chamado finalizado
                </span>
              )}
              {ticketHourData && canLog && !isFinalized && (
                <span className="text-xs text-green-700 bg-green-100 rounded px-2 py-1 ml-2">
                  Horas registradas: {Math.floor(ticketHourData.minutes / 60)}h{ticketHourData.minutes % 60 > 0 ? ` ${ticketHourData.minutes % 60}min` : ''}
                </span>
              )}
            </>
          )}
        </CardContent>
      </Card>      <Textarea
        placeholder={validationsLoading ? "Verificando permissões..." : "Digite sua mensagem..."}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        disabled={sending || validationsLoading}
      /><div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setSelectedFiles(files);
              if (files.length === 0) {
                setAttachmentType("");
              }
            }}
            className="hidden"
            disabled={sending || validationsLoading}
          />
          
          {/* Botão personalizado para selecionar arquivos */}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || validationsLoading}
            className="flex items-center gap-2"
          >
            <Paperclip className="w-4 h-4" />
            Anexar Arquivos
          </Button>
          
          {/* Mostrar arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFiles([]);
                  setAttachmentType("");
                  setEstimatedHours("");
                }}
                className="h-auto p-1 text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="attachment_type" className="text-sm font-medium whitespace-nowrap">
                Tipo do Anexo <span className="text-destructive">*</span>
              </label>
              <Select
                value={attachmentType}
                onValueChange={(value) => {
                  setAttachmentType(value);
                  // Limpar estimativa de horas se não for especificação
                  if (value !== "Especificação") {
                    setEstimatedHours("");
                  }
                }}
                disabled={sending || validationsLoading}
              >
                <SelectTrigger className="w-60" id="attachment_type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evidencia de Erro">Evidência de Erro</SelectItem>
                  <SelectItem value="Evidencia de Teste">Evidência de Teste</SelectItem>
                  <SelectItem value="Especificação">Especificação</SelectItem>
                  <SelectItem value="Detalhamento de Chamado">Detalhamento de Chamado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Campo de Estimativa de Horas - só aparece quando tipo é "Especificação" */}
          {selectedFiles.length > 0 && attachmentType === "Especificação" && (
            <div className="flex items-center gap-2">
              <label htmlFor="estimated_hours" className="text-sm font-medium whitespace-nowrap">
                Estimativa de Horas <span className="text-destructive">*</span>
              </label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 2.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-32"
                disabled={sending || validationsLoading}
              />
              <span className="text-xs text-muted-foreground">horas</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSend} 
            disabled={
              !newMessage.trim() || 
              sending || 
              !canSend || 
              validationsLoading ||
              isFinalized ||
              (selectedFiles.length > 0 && !attachmentType) ||
              (selectedFiles.length > 0 && attachmentType === "Especificação" && (!estimatedHours || estimatedHours <= 0))
            }
            className={(!canSend && !validationsLoading) || isFinalized ? "opacity-50 cursor-not-allowed" : ""}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {(() => {
              if (validationsLoading) return "Verificando...";
              if (isFinalized) return "Chamado Finalizado";
              if (!canSend) return "Envio Bloqueado";
              return "Enviar Mensagem";
            })()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageForm;
