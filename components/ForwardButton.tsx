import { Button } from "@/components/ui/button";

interface ForwardButtonProps {
  ticketId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  onSuccess?: () => void;
}

export function ForwardButton({ ticketId, userId, userEmail, userName, onSuccess }: ForwardButtonProps) {
  const handleForward = async () => {
    try {
      // Atualiza status do ticket
      await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, status_id: "3" })
      });
      // Envia e-mail ao usuário
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ticket_id: ticketId, email: userEmail, name: userName })
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
