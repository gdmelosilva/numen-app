import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Ticket } from "@/types/tickets";

interface ForwardButtonProps {
  ticketId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  ticket?: Ticket | null;
  onSuccess?: () => void;
}

export function ForwardButton({ ticketId, userId, userEmail, userName, ticket, onSuccess }: ForwardButtonProps) {
  const { user: currentUser } = useCurrentUser();
  const handleForward = async () => {
    try {
      // Atualiza status do ticket para "Em Atendimento" (3) somente se o status atual for 1
      if (ticket?.status_id === 1) {
        await fetch("/api/tickets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket_id: ticketId, status_id: "3" })
        });
      }
      
      // Torna usuário responsável pelo ticket
      await fetch("/api/ticket-resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ticket_id: ticketId, is_main: true})
      });
      
      // Envia e-mail ao usuário com template completo
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId, 
          ticket_id: ticketId,
          ticket_external_id: ticket?.external_id,
          ticket_title: ticket?.title,
          ticket_description: ticket?.description,
          project_name: ticket?.project?.projectName || 'Projeto não informado',
          partner_name: ticket?.partner?.partner_desc || 'Parceiro não informado',
          email: userEmail, 
          name: userName,
          assigned_by: currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email : undefined
        })
      });
      
      if (onSuccess) onSuccess();
      alert("Status atualizado e e-mail enviado!");
    } catch {
      alert("Erro ao atualizar status ou enviar e-mail.");
    }
  };

  return (
    <Button size="sm" variant="colored2" onClick={handleForward}>
      Encaminhar
    </Button>
  );
}
