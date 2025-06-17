import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";
import { useUserProjectHours } from "./useUserProjectHours";

// Hook para verificar se o usuário pode apontar horas
export function useCanUserLogHours(projectId?: string, contractHoursMax?: number) {
  const { user } = useCurrentUser();
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
export function useCanUserSendMessage(projectId?: string, userInContract?: boolean | null, contractLoading?: boolean) {
  const { user } = useCurrentUser();
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
    
    // Para usuários clientes (Funcional Administrativo / Key-User Cliente)
    if (user.is_client) {
      // Se ainda está carregando os dados do contrato, aguardar
      if (contractLoading) {
        setCanSend(false);
        setReason("Verificando vinculação ao contrato...");
        return;
      }
      
      // Verifica se o usuário está no contrato
      if (userInContract === false) {
        setCanSend(false);
        setReason("Usuário não está vinculado ao contrato");
        return;
      }
      
      // Se userInContract é null e não está carregando, considerar como não vinculado para projetos específicos
      if (userInContract === null && projectId) {
        setCanSend(false);
        setReason("Não foi possível verificar a vinculação ao contrato");
        return;
      }
    }    setCanSend(true);
    setReason("");
  }, [user, userInContract, contractLoading, projectId]);

  return { 
    canSend, 
    reason,
    isClient: user?.is_client || false
  };
}

// Hook para verificar se o usuário está vinculado a um contrato/projeto
export function useUserInContract(projectId?: string) {
  const { user } = useCurrentUser();
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
        const userResource = Array.isArray(data) ? data.find((resource: { user_id: string; is_suspended: boolean }) => resource.user_id === user.id) : null;
        
        setUserInContract(!!userResource);
      })
      .catch((error) => {
        console.error("Erro ao verificar vinculação:", error);
        setUserInContract(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, projectId]);

  return { userInContract, loading };
}
