import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Ticket } from "@/types/tickets";
import TicketHourDialogButton, { TicketHourData } from "./ticket-hour-dialog-button";
import { useCanUserLogHours, useCanUserSendMessage, useUserInContract } from "@/hooks/useCanUserLog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ticket.status_id ? String(ticket.status_id) : "");
  const [sending, setSending] = useState(false);
  const [ticketHourData, setTicketHourData] = useState<TicketHourData | null>(null);
  const [statusList, setStatusList] = useState<StatusOption[]>(statusOptions);
  const [statusLoading, setStatusLoading] = useState(false);  // Hooks de validação
  const { userInContract, loading: contractLoading } = useUserInContract(ticket.project_id);
  const { canSend, reason: messageReason } = useCanUserSendMessage(ticket.project_id, userInContract ?? undefined, contractLoading);
  const { canLog, reason: hoursReason, loading: hoursLoading } = useCanUserLogHours(ticket.project_id);

  // Loading geral das validações
  const validationsLoading = contractLoading || hoursLoading;

  const fileNameDisplay = selectedFiles.length > 0 ? (
    <div className="mb-2 text-sm text-muted-foreground">
      Arquivos selecionados: <span className="font-medium">{selectedFiles.map((file) => file.name).join(", ")}</span>
    </div>
  ) : null;
  async function handleSend() {
    if (!newMessage.trim()) return;

    // Validações de negócio antes de enviar
    if (!canSend) {
      toast.error(`Não é possível enviar mensagem: ${messageReason}`);
      return;
    }

    if (ticketHourData && !canLog) {
      toast.error(`Não é possível apontar horas: ${hoursReason}`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newMessage,
          is_private: isPrivate,
          status_id: selectedStatus ? Number(selectedStatus) : null,
          ticket_id: ticket.id,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Erro ao criar mensagem");
      }
      
      const createdMsg = await res.json();

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("messageId", createdMsg.id);
          const uploadRes = await fetch("/api/attachment", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) throw new Error("Erro no upload dos anexos");
        }
      }      // Se houver dados de apontamento, faz a requisição para /api/ticket-hours
      if (ticketHourData && user?.id) {
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
      }

      setNewMessage("");
      setSelectedFiles([]);
      setSelectedStatus("");
      setTicketHourData(null);
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
  }  return (
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

      {!validationsLoading && !canLog && ticketHourData && (
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
          </div>
        </div>
      )}

      {fileNameDisplay}
      <Card className="w-full py-2 rounded-md">        <CardContent className="flex flex-col md:flex-row justify-start items-center gap-6 py-0 px-6">
          {validationsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando permissões...</span>
            </div>
          )}
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
          <div className="flex items-center gap-2 min-w-60">
            <label htmlFor="statusSelect" className="text-sm text-muted-foreground font-medium">
              Status
            </label>            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              onOpenChange={(open) => { if (open) fetchStatusOptions(); }}
              disabled={validationsLoading}
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
          </div>          <TicketHourDialogButton 
            onSave={setTicketHourData} 
            initialData={ticketHourData}
          />
          {!canLog && (
            <span className="text-xs text-red-600 bg-red-100 rounded px-2 py-1">
              Apontamento bloqueado
            </span>
          )}
          {ticketHourData && canLog && (
            <span className="text-xs text-green-700 bg-green-100 rounded px-2 py-1 ml-2">
              Horas registradas: {Math.floor(ticketHourData.minutes / 60)}h{ticketHourData.minutes % 60 > 0 ? ` ${ticketHourData.minutes % 60}min` : ''}
            </span>
          )}
        </CardContent>
      </Card>      <Textarea
        placeholder={validationsLoading ? "Verificando permissões..." : "Digite sua mensagem..."}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        disabled={sending || validationsLoading}
      /><div className="flex items-center gap-2">        <Button 
          onClick={handleSend} 
          disabled={!newMessage.trim() || sending || !canSend || validationsLoading}
          className={(!canSend && !validationsLoading) ? "opacity-50 cursor-not-allowed" : ""}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {(() => {
            if (validationsLoading) return "Verificando...";
            if (!canSend) return "Envio Bloqueado";
            return "Enviar Mensagem";
          })()}
        </Button>        <Input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setSelectedFiles(files);
          }}
          className="text-sm"
          disabled={sending || validationsLoading}
        />
      </div>
    </div>
  );
};

export default MessageForm;
