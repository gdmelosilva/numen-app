import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, UserCircle, Clock } from "lucide-react";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";

export type MessageCardProps = {
  msg: {
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
    msg_ref?: string; // Referência a outra mensagem, se aplicável
    ref_msg_id?: string; // Garante compatibilidade com backend
    system_hours?: number | null; // Campo opcional para horas sistêmicas
  };
};

export function MessageCard({ msg }: MessageCardProps) {
  const { statuses: ticketStatuses, loading: statusesLoading } = useTicketStatuses();

  function getStatusName(statusId: string | number | undefined) {
    if (statusesLoading) return "Carregando...";
    if (!statusId) return "Sem status";
    const found = ticketStatuses.find(s => String(s.id) === String(statusId));
    return found ? String(found.name).trim() : "Sem status";
  }

  return (
    <div
      key={msg.id}
      className={`p-4 rounded border space-y-2 border-l-4 min-h-[160px] ${msg.is_system ? 'bg-red-500/10 border-l-red-600' : (msg.user?.is_client ? 'border-l-blue-600' : 'border-l-orange-500')}`}
    >
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="w-fit">{getStatusName(msg.msgStatus)}</Badge>
          {msg.msgPrivate && <Badge variant="destructive" className="w-fit">Privado</Badge>}
          {msg.is_system ? (
            <Badge variant="outline" className="w-fit bg-red-500/20 text-red-700">Sistema</Badge>
          ) : (
            <Badge
              variant="outline"
              className={`w-fit text-normal ${msg.user?.is_client ? 'bg-blue-600/25 text-white' : 'bg-orange-500/80 text-white'} `}
            >
              {msg.user?.is_client ? "Cliente" : "Numen"}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {msg.createdAt ? new Date(msg.createdAt).toLocaleString("pt-BR") : "-"}
          </div>
          <div className="flex items-center gap-1 italic">
            <UserCircle className="w-4 h-4" />
            {msg.user?.name || "Usuário desconhecido"}
            {/* Exibe horas ao lado do nome se sistêmica */}
          </div>
          {msg.msgHours && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Estimadas {msg.msgHours} hora(s)
            </div>
          )}
        </div>
      </div>
      <div className="text-sm whitespace-pre-wrap">{msg.msgBody}</div>
      {(msg.attachments && msg.attachments.length > 0) && (
        <div className="pt-2 space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Anexos:</div>          <ul className="list-inside text-sm text-blue-400 space-y-0.5 list-none">
            {(msg.attachments ?? []).map((file) => (
              <li key={file.id}>
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
                  className="hover:underline text-blue-400 cursor-pointer bg-transparent border-none p-0"
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
