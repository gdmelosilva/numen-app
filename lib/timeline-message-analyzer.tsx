import { FileText, AlertCircle, UserCircle, Clock, CheckCircle, Users, Eye } from "lucide-react";

export interface TimelineStage {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: 'status_change' | 'message' | 'assignment' | 'update';
  status?: string;
  user?: string;
  icon?: React.ReactNode;
  stage?: number;
}

export interface SystemMessage {
  id: string;
  body: string;
  status_id?: string;
  created_at: string;
  created_by_user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  user?: {
    name: string;
    is_client?: boolean;
  };
  status?: {
    id: string;
    name: string;
    stage?: number;
  };
}

// Definição dos 7 estágios fixos
export const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: 1,
    name: "Ag. Alocação",
    description: "Aguardando alocação de recursos",
    icon: <Users className="w-4 h-4" />,
    color: "bg-orange-500"
  },
  {
    id: 2,
    name: "Em Análise",
    description: "Em análise técnica",
    icon: <Eye className="w-4 h-4" />,
    color: "bg-blue-500"
  },
  {
    id: 3,
    name: "Ag. Aprovação Cliente",
    description: "Aguardando aprovação do cliente",
    icon: <Clock className="w-4 h-4" />,
    color: "bg-yellow-500"
  },
  {
    id: 4,
    name: "Em Atuação",
    description: "Em desenvolvimento/execução",
    icon: <AlertCircle className="w-4 h-4" />,
    color: "bg-green-500"
  },
  {
    id: 5,
    name: "Ag. Validação Cliente",
    description: "Aguardando validação do cliente",
    icon: <UserCircle className="w-4 h-4" />,
    color: "bg-purple-500"
  },
  {
    id: 6,
    name: "Ag. Encerramento",
    description: "Aguardando encerramento",
    icon: <Clock className="w-4 h-4" />,
    color: "bg-indigo-500"
  },
  {
    id: 7,
    name: "Finalizado",
    description: "Chamado finalizado",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-gray-500"
  }
];

/**
 * Analisa mensagens do sistema e determina o estágio atual do chamado
 */
export class TimelineMessageAnalyzer {
  
  /**
   * Processa mensagens do sistema e retorna o estágio atual do chamado
   */
  static processSystemMessages(messages: SystemMessage[]): {
    currentStage: number;
    completedStages: number[];
    lastStatusDate?: string;
    lastUser?: string;
  } {
    if (!messages || messages.length === 0) {
      return { currentStage: 1, completedStages: [] };
    }

    // Filtra mensagens do sistema com status válido
    const systemMessages = messages
      .filter(msg => msg.status && msg.status.stage !== undefined)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (systemMessages.length === 0) {
      return { currentStage: 1, completedStages: [] };
    }

    // Pega a última mensagem para determinar o estágio atual
    const lastMessage = systemMessages[systemMessages.length - 1];
    let currentStage = lastMessage.status?.stage || 1;

    // Se o último status tem stage = null, usa o último estágio encontrado
    if (lastMessage.status?.stage === null || lastMessage.status?.stage === undefined) {
      const messagesWithStage = systemMessages.filter(msg => msg.status?.stage !== null && msg.status?.stage !== undefined);
      if (messagesWithStage.length > 0) {
        const lastWithStage = messagesWithStage[messagesWithStage.length - 1];
        currentStage = lastWithStage.status?.stage || 1;
      }
    }

    // Determina estágios completados baseado na progressão
    const completedStages: number[] = [];

    // Todos os estágios menores que o atual são considerados completados
    for (let i = 1; i < currentStage; i++) {
      completedStages.push(i);
    }

    return {
      currentStage,
      completedStages,
      lastStatusDate: lastMessage.created_at,
      lastUser: lastMessage.user?.name
    };
  }

  /**
   * Mapeia uma mensagem do sistema para um evento da timeline (não usado no novo modelo)
   */
  static mapSystemMessageToEvent(message: SystemMessage): TimelineEvent | null {
    if (!message.status || !message.status.name) {
      return null;
    }
    
    const body = message.body || '';
    
    if (!body.startsWith('SISTEMA:') && !body.startsWith('SISTEMA -')) {
      return null;
    }

    const eventData = TimelineMessageAnalyzer.analyzeSystemMessage(body, message.status.name);
    const user = message.user?.name || 'Sistema';

    return {
      id: message.id,
      title: eventData.title,
      description: body.replace('SISTEMA:', '').replace('SISTEMA -', '').trim(),
      timestamp: message.created_at,
      type: eventData.type,
      status: message.status.name,
      user,
      icon: eventData.icon,
      stage: message.status.stage
    };
  }

  /**
   * Analisa o conteúdo da mensagem do sistema e determina o tipo de evento
   */
  static analyzeSystemMessage(body: string, status: string): {
    title: string;
    type: 'status_change' | 'message' | 'assignment' | 'update';
    icon: React.ReactNode;
  } {
    let title = '';
    let type: 'status_change' | 'message' | 'assignment' | 'update' = 'status_change';
    let icon = <FileText className="w-4 h-4" />;

    if (body.includes('ABERTURA DE CHAMADO')) {
      title = 'Chamado criado';
      icon = <FileText className="w-4 h-4" />;
      type = 'status_change';
    } else if (body.includes('ALTERAÇÃO DE STATUS:')) {
      title = `Status: ${status}`;
      icon = <AlertCircle className="w-4 h-4" />;
      type = 'status_change';
    } else if (body.includes('ATRIBUIÇÃO') || body.includes('RECURSO')) {
      title = 'Recurso atribuído';
      icon = <UserCircle className="w-4 h-4" />;
      type = 'assignment';
    } else if (body.includes('FECHAMENTO') || body.includes('FINALIZAÇÃO')) {
      title = 'Chamado finalizado';
      icon = <AlertCircle className="w-4 h-4" />;
      type = 'status_change';
    } else if (body.includes('REABERTURA')) {
      title = 'Chamado reaberto';
      icon = <AlertCircle className="w-4 h-4" />;
      type = 'status_change';
    } else if (body.includes('CANCELAMENTO')) {
      title = 'Chamado cancelado';
      icon = <AlertCircle className="w-4 h-4" />;
      type = 'status_change';
    } else {
      // Para outras mensagens do sistema
      title = 'Atualização do sistema';
      icon = <Clock className="w-4 h-4" />;
      type = 'update';
    }

    return { title, type, icon };
  }

  /**
   * Determina a cor do evento baseada no status e tipo
   */
  static getEventColor(type: string, status?: string): string {
    // Para eventos de sistema (assignments automáticos)
    if (type === 'assignment') {
      return 'bg-gray-500'; // Sistema
    }

    // Determina cor baseada no status/responsabilidade
    if (!status) {
      return 'bg-gray-500'; // Default sistema
    }

    const statusLower = status.toLowerCase();
    
    // Status que indicam responsabilidade do cliente - COR AZUL
    if (
      statusLower.includes('aguardando aprovação') ||
      statusLower.includes('aguardando retorno') ||
      statusLower.includes('pendente cliente') ||
      statusLower.includes('validação cliente') ||
      statusLower.includes('aprovação') ||
      statusLower.includes('teste cliente') ||
      statusLower.includes('homologação')
    ) {
      return 'bg-blue-500'; // Cliente
    }
    
    // Status que indicam responsabilidade da Numen - COR VERDE
    if (
      statusLower.includes('em análise') ||
      statusLower.includes('em desenvolvimento') ||
      statusLower.includes('desenvolvimento') ||
      statusLower.includes('em andamento') ||
      statusLower.includes('pronto para teste') ||
      statusLower.includes('teste interno') ||
      statusLower.includes('correção') ||
      statusLower.includes('implementação') ||
      statusLower.includes('deploy')
    ) {
      return 'bg-green-500'; // Numen
    }

    // Status neutros ou iniciais - COR CINZA
    if (
      statusLower.includes('aberto') ||
      statusLower.includes('criado') ||
      statusLower.includes('fechado') ||
      statusLower.includes('concluído') ||
      statusLower.includes('cancelado')
    ) {
      return 'bg-gray-500'; // Sistema
    }

    // Default para status não mapeados - assume Numen
    return 'bg-green-500';
  }

  /**
   * Determina a variante do badge baseada no tipo de evento
   */
  static getEventBadgeVariant(type: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (type) {
      case 'status_change':
        return 'default';
      case 'assignment':
        return 'secondary';
      case 'message':
        return 'outline';
      case 'update':
        return 'secondary';
      default:
        return 'outline';
    }
  }
}
