"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ToggleNotifyButtonProps {
  readonly ticketId: string;
  readonly userId: string;
  readonly onNotifyChanged?: (notify: boolean) => void;
}

export function ToggleNotifyButton({ ticketId, userId, onNotifyChanged }: Readonly<ToggleNotifyButtonProps>) {
  const [notify, setNotify] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Buscar estado atual do notify ao carregar
  useEffect(() => {
    async function checkNotifyStatus() {
      setChecking(true);
      try {
        const response = await fetch(`/api/ticket-resources?ticket_id=${ticketId}`);
        if (!response.ok) throw new Error("Erro ao verificar status de notificação");
        
        const resources = await response.json();
        const userResource = resources.find((r: { user_id: string }) => r.user_id === userId);
        
        if (userResource) {
          setNotify(userResource.notify ?? true); // Default true se não existir
        } else {
          setNotify(null); // Usuário não é recurso do ticket
        }
      } catch (error) {
        console.error("Erro ao verificar status de notificação:", error);
        setNotify(null);
      } finally {
        setChecking(false);
      }
    }

    if (ticketId && userId) {
      checkNotifyStatus();
    }
  }, [ticketId, userId]);

  const toggleNotify = async () => {
    if (notify === null) return;
    
    setLoading(true);
    try {
      const newNotifyState = !notify;
      
      const response = await fetch("/api/ticket-resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ticket_id: ticketId,
          notify: newNotifyState,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar notificação");

      setNotify(newNotifyState);
      toast.success(
        newNotifyState
          ? "Você receberá notificações por email sobre este chamado"
          : "Você não receberá mais notificações por email sobre este chamado"
      );
      
      if (onNotifyChanged) {
        onNotifyChanged(newNotifyState);
      }
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
      toast.error("Erro ao atualizar preferência de notificação");
    } finally {
      setLoading(false);
    }
  };

  // Não exibir botão se o usuário não é recurso do ticket
  if (notify === null) {
    return null;
  }

  // Exibir loading enquanto verifica
  if (checking) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Verificando...
      </Button>
    );
  }

  return (
    <Button
      variant={notify ? "default" : "outline"}
      size="sm"
      onClick={toggleNotify}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Atualizando...
        </>
      ) : (
        <>
          {notify ? (
            <>
              <Bell className="h-4 w-4" />
              Notificações Ativadas
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4" />
              Ativar Notificações
            </>
          )}
        </>
      )}
    </Button>
  );
}
