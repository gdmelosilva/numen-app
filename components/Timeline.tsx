"use client";

import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { 
  SystemMessage, 
  TimelineMessageAnalyzer,
  TIMELINE_STAGES
} from "@/lib/timeline-message-analyzer";

interface TimelineProps {
  ticketId?: string;
  className?: string;
}

interface TimelineState {
  currentStage: number;
  completedStages: number[];
  lastStatusDate?: string;
  lastUser?: string;
}

export default function Timeline({ ticketId, className = "" }: TimelineProps) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentStage: 1,
    completedStages: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca dados quando o ticketId muda
  useEffect(() => {
    const fetchSystemMessages = async () => {
      if (!ticketId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/messages?ticket_id=${ticketId}&system_only=true&status_only=true`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar mensagens do sistema');
        }
        
        const messages: SystemMessage[] = await response.json();
        
        // Processa mensagens para determinar estágio atual
        const result = TimelineMessageAnalyzer.processSystemMessages(messages);
        setTimelineState(result);
        
      } catch (err) {
        console.error('Erro ao buscar timeline:', err);
        setError('Erro ao carregar timeline do chamado');
        setTimelineState({ currentStage: 1, completedStages: [] });
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchSystemMessages();
    } else {
      setTimelineState({ currentStage: 1, completedStages: [] });
    }
  }, [ticketId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStageStatus = (stageId: number): 'completed' | 'current' | 'pending' => {
    if (timelineState.completedStages.includes(stageId)) {
      return 'completed';
    }
    if (stageId === timelineState.currentStage) {
      return 'current';
    }
    return 'pending';
  };

  const getStageColor = (status: 'completed' | 'current' | 'pending'): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'current':
        return 'bg-blue-500 border-blue-500 ring-4 ring-blue-200';
      case 'pending':
        return 'bg-gray-300 border-gray-300';
    }
  };

  const getConnectorColor = (fromStage: number): string => {
    const fromStatus = getStageStatus(fromStage);
    return fromStatus === 'completed' ? 'bg-green-400' : 'bg-gray-200';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
          <Calendar className="w-4 h-4" />
          Progresso do Chamado
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando progresso...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
          <Calendar className="w-4 h-4" />
          Progresso do Chamado
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const lastUpdate = formatDate(timelineState.lastStatusDate);

  return (
    <div className={`${className} min-h-[200px]`}>
      <div className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium mb-4">
        <Calendar className="w-4 h-4" />
        Progresso do Chamado
      </div>
      
      <div className="relative">
        {/* Container scrollável horizontal com altura aumentada */}
        <div className="overflow-x-auto pb-6">
          <div className="flex items-center min-w-max px-4 py-8">
            {TIMELINE_STAGES.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const isLast = index === TIMELINE_STAGES.length - 1;
              
              return (
                <React.Fragment key={stage.id}>
                  {/* Estágio */}
                  <div className="flex flex-col items-center min-w-[120px]">
                    {/* Círculo do estágio */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                      ${getStageColor(status)}
                      ${status === 'current' ? 'scale-110' : ''}
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-bold text-sm">{stage.id}</span>
                      )}
                    </div>
                    
                    {/* Nome do estágio */}
                    <h3 className={`
                      mt-2 text-xs font-medium text-center max-w-[120px] leading-tight
                      ${status === 'current' ? 'text-blue-600 font-semibold' : ''}
                      ${status === 'completed' ? 'text-green-600' : ''}
                      ${status === 'pending' ? 'text-gray-500' : ''}
                    `}>
                      {stage.name}
                    </h3>
                    
                    {/* Descrição */}
                    <p className="text-xs text-gray-400 text-center max-w-[120px] mt-1">
                      {stage.description}
                    </p>
                    
                    {/* Mostra informações do estágio atual */}
                    {status === 'current' && lastUpdate && (
                      <div className="mt-2 text-xs text-center text-blue-600 max-w-[120px]">
                        <div>Desde {lastUpdate.date}</div>
                        <div>{lastUpdate.time}</div>
                        {timelineState.lastUser && (
                          <div className="mt-1 font-medium truncate">{timelineState.lastUser}</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Conector entre estágios - ocupa todo o espaço disponível */}
                  {!isLast && (
                    <div className="flex-1 px-2">
                      <div className={`
                        h-0.5 w-full transition-all duration-300
                        ${getConnectorColor(stage.id)}
                      `} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-4 pt-2 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-700">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200"></div>
              <span className="text-blue-700">Atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-gray-500">Pendente</span>
            </div>
          </div>
          
          {/* Progresso geral */}
          <div className="mt-3 text-center">
            <div className="text-sm text-gray-600">
              Progresso: {timelineState.completedStages.length} de {TIMELINE_STAGES.length} estágios concluídos
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(timelineState.completedStages.length / TIMELINE_STAGES.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
