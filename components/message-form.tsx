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
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ticket.status_id ? String(ticket.status_id) : "");
  const [sending, setSending] = useState(false);
  const [ticketHourData, setTicketHourData] = useState<TicketHourData | null>(null);
  const [statusList, setStatusList] = useState<StatusOption[]>(statusOptions);
  const [statusLoading, setStatusLoading] = useState(false);

  const fileNameDisplay = selectedFiles.length > 0 ? (
    <div className="mb-2 text-sm text-muted-foreground">
      Arquivos selecionados: <span className="font-medium">{selectedFiles.map((file) => file.name).join(", ")}</span>
    </div>
  ) : null;

  async function handleSend() {
    if (!newMessage.trim()) return;
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
      if (!res.ok) throw new Error("Erro ao criar mensagem");
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
      }

      // Se houver dados de apontamento, faz a requisição para /api/ticket-hours
      if (ticketHourData) {
        // Monta timestamps completos para appoint_start e appoint_end
        const appointDate = ticketHourData.appointDate;
        const appointStart = appointDate && ticketHourData.appointStart
          ? `${appointDate}T${ticketHourData.appointStart}:00`
          : null;
        const appointEnd = appointDate && ticketHourData.appointEnd
          ? `${appointDate}T${ticketHourData.appointEnd}:00`
          : null;
        await fetch("/api/ticket-hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: ticket.project_id,
            ticket_id: ticket.id,
            message_id: createdMsg.id,
            user_id: typeof ticket.created_by_user === 'object' && ticket.created_by_user !== null && 'id' in ticket.created_by_user
              ? ticket.created_by_user.id
              : ticket.created_by,
            minutes: ticketHourData.minutes,
            appoint_date: appointDate,
            appoint_start: appointStart,
            appoint_end: appointEnd,
          }),
        });
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
  }

  return (
    <div className="w-full space-y-2 mt-4">
      {fileNameDisplay}
      <Card className="w-full py-2 rounded-md">
        <CardContent className="flex flex-col md:flex-row justify-start items-center gap-6 py-0 px-6">
          <div className="flex items-center gap-2">
            <label htmlFor="privateSwitch" className="text-sm text-muted-foreground font-medium">
              Mensagem Privada
            </label>
            <Switch id="privateSwitch" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <div className="flex items-center gap-2 min-w-60">
            <label htmlFor="statusSelect" className="text-sm text-muted-foreground font-medium">
              Status
            </label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              onOpenChange={(open) => { if (open) fetchStatusOptions(); }}
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
          <TicketHourDialogButton onSave={setTicketHourData} initialData={ticketHourData} />
          {ticketHourData && (
            <span className="text-xs text-green-700 bg-green-100 rounded px-2 py-1 ml-2">
              Horas registradas: {Math.floor(ticketHourData.minutes / 60)}h{ticketHourData.minutes % 60 > 0 ? ` ${ticketHourData.minutes % 60}min` : ''}
            </span>
          )}
        </CardContent>
      </Card>
      <Textarea
        placeholder="Digite sua mensagem..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        disabled={sending}
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Enviar Mensagem
        </Button>
        <Input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setSelectedFiles(files);
          }}
          className="text-sm"
          disabled={sending}
        />
      </div>
    </div>
  );
};

export default MessageForm;
