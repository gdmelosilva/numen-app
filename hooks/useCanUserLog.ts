import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";
import { useUserProjectHours } from "./useUserProjectHours";

// Cache global para evitar recarregamentos desnecessários
const contractCache = new Map<string, { data: boolean | null; timestamp: number }>();
const hoursCache = new Map<string, { data: { canLog: boolean; reason: string; userProjectHours: number | null }; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// Função para limpar cache quando necessário (ex: após mudanças de permissão)
export function clearValidationCache(userId?: string, projectId?: string) {
  if (userId && projectId) {
    // Limpa cache específico
    const contractKey = `${userId}-${projectId}`;
    contractCache.delete(contractKey);
    
    // Limpa todos os caches de horas para este usuário/projeto
    for (const key of hoursCache.keys()) {
      if (key.startsWith(`${userId}-${projectId}-`)) {
        hoursCache.delete(key);
      }
    }
  } else {
    // Limpa todo o cache se não especificar usuário/projeto
    contractCache.clear();
    hoursCache.clear();
  }
}

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

    const cacheKey = `${user.id}-${projectId}-${contractHoursMax}-${userProjectHours}`;
    const cached = hoursCache.get(cacheKey);
    
    // Verifica se tem cache válido
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setCanLog(cached.data.canLog);
      setReason(cached.data.reason);
      return;
    }

    // Verifica se o usuário está ativo
    if (!user.is_active) {
      const result = { canLog: false, reason: "Usuário está suspenso/inativo", userProjectHours };
      hoursCache.set(cacheKey, { data: result, timestamp: Date.now() });
      setCanLog(false);
      setReason("Usuário está suspenso/inativo");
      return;
    }

    // Verifica se as horas do usuário no projeto extrapolaram o limite do contrato
    if (contractHoursMax && userProjectHours !== null && userProjectHours >= contractHoursMax) {
      const result = { canLog: false, reason: "Horas do contrato extrapoladas", userProjectHours };
      hoursCache.set(cacheKey, { data: result, timestamp: Date.now() });
      setCanLog(false);
      setReason("Horas do contrato extrapoladas");
      return;
    }

    const result = { canLog: true, reason: "", userProjectHours };
    hoursCache.set(cacheKey, { data: result, timestamp: Date.now() });
    setCanLog(true);
    setReason("");
  }, [user, userProjectHours, hoursLoading, contractHoursMax, projectId]);

  return { 
    canLog, 
    reason, 
    loading: hoursLoading,
    userProjectHours 
  };
}

// Hook para verificar se o usuário pode enviar mensagens
export function useCanUserSendMessage(projectId?: string, userInContract?: boolean) {
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
      // Verifica se o usuário está no contrato
      if (userInContract === false) {
        setCanSend(false);
        setReason("Usuário não está vinculado ao contrato");
        return;
      }
    }

    setCanSend(true);
    setReason("");
  }, [user, userInContract]);

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
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!user?.id || !projectId) {
      setUserInContract(null);
      return;
    }

    const cacheKey = `${user.id}-${projectId}`;
    const cached = contractCache.get(cacheKey);
    
    // Verifica se tem cache válido
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setUserInContract(cached.data);
      return;
    }

    setLoading(true);
    
    // Faz uma consulta para verificar se o usuário está vinculado ao projeto
    fetch(`/api/project-resources?project_id=${projectId}`)
      .then((res) => res.json())
      .then((data) => {        // Verifica se o usuário está na lista de recursos do projeto
        const userResource = Array.isArray(data) ? data.find((resource: { user_id: string; is_suspended: boolean }) => resource.user_id === user.id) : null;
        const result = !!userResource;
        
        // Salva no cache
        contractCache.set(cacheKey, { data: result, timestamp: Date.now() });
        setUserInContract(result);
      })
      .catch(() => {
        // Em caso de erro, não armazena no cache
        setUserInContract(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, projectId]);

  return { userInContract, loading };
}
