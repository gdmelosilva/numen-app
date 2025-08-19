import { useEffect, useState } from "react";
import { useUserContext } from "@/components/user-context";
import { useUserProjectHours } from "./useUserProjectHours";

// Hook para verificar se o usuário pode apontar horas
export function useCanUserLogHours(projectId?: string, contractHoursMax?: number) {
  const { user } = useUserContext();
  const { hours: userProjectHours, loading: hoursLoading } = useUserProjectHours(user?.id, projectId);
  const [canLog, setCanLog] = useState(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (!user || hoursLoading) {
      setCanLog(false);
      setReason("Carregando informações do usuário...");
      return;
    }

    // Verifica se o usuário está ativo
    if (!user.is_active) {
      setCanLog(false);
      setReason("Usuário está suspenso/inativo");
      return;
    }

    // Verifica se as horas do usuário no projeto extrapolaram o limite do contrato
    if (contractHoursMax && userProjectHours !== null && userProjectHours >= contractHoursMax) {
      setCanLog(false);
      setReason("Horas do contrato extrapoladas");
      return;
    }

    setCanLog(true);
    setReason("");
  }, [user, userProjectHours, hoursLoading, contractHoursMax]);

  return { 
    canLog, 
    reason, 
    loading: hoursLoading,
    userProjectHours 
  };
}

// Hook para verificar se o usuário pode enviar mensagens
// Adicione partnerId como parâmetro para validar cliente
export function useCanUserSendMessage(projectId?: string, userInContract?: boolean | null, contractLoading?: boolean, partnerId?: string) {
  const { user } = useUserContext();
  const [canSend, setCanSend] = useState(false);
  const [reason, setReason] = useState<string>("");
  useEffect(() => {
    if (!user) {
      setCanSend(false);
      setReason("Usuário não encontrado");
      return;
    }

    // Verifica se o usuário está ativo
    if (!user.is_active) {
      setCanSend(false);
      setReason("Usuário está suspenso/inativo");
      return;
    }

    // Administrador Administrativo (role=1, is_client=false) sempre pode
    if (user.role === 1 && !user.is_client) {
      setCanSend(true);
      setReason("");
      return;
    }

    // Gerente Administrativo (role=2, is_client=false) e Funcional Administrativo (role=3, is_client=false): só se alocado
    if ((user.role === 2 || user.role === 3) && !user.is_client) {
      if (contractLoading) {
        setCanSend(false);
        setReason("Verificando vinculação ao contrato...");
        return;
      }
      if (!userInContract) {
        setCanSend(false);
        setReason("Usuário não está vinculado ao contrato");
        return;
      }
      setCanSend(true);
      setReason("");
      return;
    }

    // Cliente (qualquer role, is_client=true): só se o contrato for do partner associado
    if (user.is_client) {
      if (contractLoading) {
        setCanSend(false);
        setReason("Verificando vínculo ao contrato...");
        return;
      }
      // Se o partnerId do projeto não bate com o do usuário, bloquear
      if (partnerId && user.partner_id && String(partnerId) !== String(user.partner_id)) {
        setCanSend(false);
        setReason("Usuário não pertence ao parceiro deste contrato");
        return;
      }
      // Para cliente, não precisa checar userInContract
      setCanSend(true);
      setReason("");
      return;
    }

    // Outros casos: negar
    setCanSend(false);
    setReason("Permissão insuficiente para enviar mensagens");
  }, [user, userInContract, contractLoading, projectId, partnerId]);

  return { 
    canSend, 
    reason,
    isClient: user?.is_client || false
  };
}

// Hook para verificar se o usuário está vinculado a um contrato/projeto
export function useUserInContract(projectId?: string) {
  const { user } = useUserContext();
  const [userInContract, setUserInContract] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);  useEffect(() => {
    if (!user?.id || !projectId) {
      setUserInContract(null);
      return;
    }

    setLoading(true);
    
    // Faz uma consulta para verificar se o usuário está vinculado ao projeto
    fetch(`/api/project-resources?project_id=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        // Verifica se o usuário está na lista de recursos do projeto
        const userResource = Array.isArray(data)
          ? data.find((resource: { user_id: string; is_suspended: boolean }) => String(resource.user_id) === String(user.id))
          : null;
        setUserInContract(!!userResource);
      })
      .catch(() => {
        setUserInContract(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, projectId]);

  return { userInContract, loading };
}
