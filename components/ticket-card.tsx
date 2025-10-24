"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Users, ExternalLink, Ticket as TicketIcon } from "lucide-react";
import type { Ticket } from "@/types/tickets";
import { AuthenticatedUser } from "@/lib/api-auth";
import { useRouter } from "next/navigation";

interface TicketCardProps {
  ticket: Ticket;
  user?: AuthenticatedUser | null;
  onLinkResource?: (ticket: Ticket) => void;
  onClick?: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, user, onLinkResource, onClick }: TicketCardProps) {
  const router = useRouter();
  const ticketId = ticket.external_id || ticket.id;

  const handleCardClick = () => {
    if (onClick) {
      onClick(ticket);
    }
  };

  const handleOpenTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ticketId) {
      const url = `/main/smartcare/management/${ticketId}`;
      window.open(url, '_blank');
    }
  };

  const handleDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ticketId) {
      router.push(`/main/smartcare/management/${ticketId}`);
    }
  };

  const handleLinkResource = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onLinkResource) {
      onLinkResource(ticket);
    }
  };

  // Verificar se o usuário pode vincular recursos (admin-adm ou manager-adm)
  const canLinkResource = user && !user.is_client && (
    user.role === 1 || // admin-adm
    user.role === 2    // manager-adm
  );

  // Formatar recursos
  const resources = ticket.resources || [];
  const mainResource = resources.find(r => r.is_main);
  const otherResources = resources.filter(r => !r.is_main);

  const getMainResourceName = () => {
    if (mainResource && mainResource.user) {
      return `${mainResource.user.first_name || ""} ${mainResource.user.last_name || ""}`.trim() 
        || mainResource.user.email 
        || mainResource.user.id;
    }
    return null;
  };

  const getOtherResourcesText = () => {
    const count = otherResources.length;
    if (count === 0) return null;
    
    if (count === 1 && otherResources[0].user) {
      return `${otherResources[0].user.first_name || ""} ${otherResources[0].user.last_name || ""}`.trim() 
        || otherResources[0].user.email 
        || otherResources[0].user.id;
    }
    
    return `${count} recurso${count > 1 ? 's' : ''}`;
  };

  const getCreatedByName = () => {
    const createdByUser = ticket.created_by_user;
    if (createdByUser) {
      return createdByUser.first_name && createdByUser.last_name 
        ? `${createdByUser.first_name} ${createdByUser.last_name}`
        : createdByUser.name || createdByUser.id;
    }
    return null;
  };

  // Função para verificar se o ticket está finalizado
  const isTicketFinalized = () => {
    return ticket.status?.name === "Finalizado" || ticket.status?.name === "Enc. para Encerramento";
  };

  // Função para obter a classe de cor da borda baseada na prioridade (para hover)
  const getPriorityHoverClass = () => {
    // Se o ticket está finalizado, usa hover mais sutil
    if (isTicketFinalized()) {
      return "hover:border-l-gray-400 hover:opacity-75";
    }

    if (!ticket.priority?.name) return "hover:border-l-primary";
    
    const priority = ticket.priority.name.toLowerCase();
    
    if (priority.includes("alta") || priority.includes("high") || priority.includes("crítica") || priority.includes("critical")) {
      return "hover:border-l-red-500";
    } else if (priority.includes("média") || priority.includes("medium") || priority.includes("normal")) {
      return "hover:border-l-yellow-500";
    } else if (priority.includes("baixa") || priority.includes("low")) {
      return "hover:border-l-green-500";
    } else if (priority.includes("urgente") || priority.includes("urgent")) {
      return "hover:border-l-red-700";
    }
    
    return "hover:border-l-primary";
  };

  // Função para obter as classes de estilo da badge de prioridade
  const getPriorityBadgeClasses = () => {
    if (!ticket.priority?.name) return "bg-slate-100 text-slate-800 border-slate-200";
    
    const priority = ticket.priority.name;
    
    // Baseado no mapeamento original do ColoredBadge
    switch (priority) {
      case "Alta":
        return "bg-orange-100 text-orange-800 border-orange-200"; // orange
      case "Média":
        return "bg-green-100 text-green-800 border-green-200"; // approved
      case "Baixa":
        return "bg-blue-100 text-blue-800 border-blue-200"; // primary
      case "Crítica":
        return "bg-red-100 text-red-800 border-red-200"; // destructive
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Função para obter as classes de estilo da badge de status
  const getStatusBadgeClasses = () => {
    if (!ticket.status?.name) return "bg-slate-100 text-slate-800 border-slate-200";
    
    const status = ticket.status.name;
    
    // Baseado no mapeamento original do ColoredBadge
    switch (status) {
      case "Ag. Atendimento":
      case "Enc. para o Atendente":
        return "bg-gray-100 text-gray-800 border-gray-200"; // ticket-gray
      case "Em Analise":
      case "Ag. Apr. do Solicitante":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // ticket-yellow
      case "Finalizado":
      case "Enc. para Encerramento":
        return "bg-green-100 text-green-800 border-green-200"; // ticket-green
      case "Enc. para o Solicitante":
      case "Em Estimativa":
        return "bg-orange-100 text-orange-800 border-orange-200"; // ticket-orange
      case "Na Fábrica":
        return "bg-purple-100 text-purple-800 border-purple-200"; // ticket-purple
      case "Ag. Valid. Solicitante":
      case "Ag. Alocação ABAP":
      case "Ag. Testes Solicitante":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"; // ticket-cyan
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Função para calcular a porcentagem do SLA
  const getSLAPercentage = () => {
    if (!ticket.created_at || !ticket.planned_end_date) return 0;
    
    const createdAt = new Date(ticket.created_at);
    const plannedEnd = new Date(ticket.planned_end_date);
    const now = new Date();
    
    // Se já passou da data prevista, retorna 100%
    if (now > plannedEnd) return 100;
    
    const totalTime = plannedEnd.getTime() - createdAt.getTime();
    const usedTime = now.getTime() - createdAt.getTime();
    
    if (totalTime <= 0) return 0;
    
    const percentage = Math.min(100, Math.max(0, (usedTime / totalTime) * 100));
    return Math.round(percentage);
  };

  // Função para obter a cor da barra de SLA baseada na porcentagem
  const getSLABarColor = () => {
    const percentage = getSLAPercentage();
    
    if (percentage <= 50) {
      return "bg-green-500"; // Verde - OK
    } else if (percentage <= 80) {
      return "bg-yellow-500"; // Amarelo - Atenção
    } else if (percentage <= 95) {
      return "bg-orange-500"; // Laranja - Crítico
    } else {
      return "bg-red-500"; // Vermelho - Vencido/Quase vencido
    }
  };

  // Função para obter a data e hora prevista de encerramento do SLA
  const getSLAEndDate = () => {
    if (!ticket.planned_end_date) return "N/A";
    
    try {
      const endDate = new Date(ticket.planned_end_date);
      return format(endDate, "dd/MM/yy HH:mm", { locale: ptBR });
    } catch {
      return "N/A";
    }
  };

  // Função para obter as classes CSS para tickets finalizados
  const getFinalizedCardClasses = () => {
    if (isTicketFinalized()) {
      return "opacity-60 bg-green-50/30 border-l-green-200";
    }
    return "border-l-gray-200";
  };

  return (
    <Card 
      className={`ticket-card cursor-pointer border-l-4 ${getFinalizedCardClasses()} ${getPriorityHoverClass()} transition-all duration-300`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex">
          {/* Barra de SLA na lateral esquerda */}
          <div className="flex flex-col items-center w-20 py-2 pr-6 mr-6 border-r border-gray-200">
            {/* Label SLA */}
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">SLA</div>
            
            {/* Barra de progresso SLA */}
            <div className="flex flex-col items-center mb-3">
              <div className="w-4 h-20 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`w-full transition-all duration-300 rounded-full ${getSLABarColor()}`}
                  style={{ height: `${getSLAPercentage()}%` }}
                />
              </div>
              <div className="text-xs font-bold mt-2 text-center">
                {getSLAPercentage()}%
              </div>
            </div>
            
            {/* Data prevista de encerramento SLA */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Prev. SLA</div>
              <div className="text-xs font-medium">
                {getSLAEndDate()}
              </div>
            </div>
          </div>

          {/* Coluna de Badges */}
          <div className="flex flex-col items-stretch w-28 py-2 pr-6 mr-6 border-r border-gray-200">
            
            {/* Badge de Status */}
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1 text-center">Status</div>
              <div className={`px-2 py-1 rounded text-xs font-bold uppercase border w-full text-center ${getStatusBadgeClasses()}`}>
                {ticket.status?.name || "N/A"}
              </div>
            </div>

            {/* Badge de Categoria */}
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1 text-center">Categoria</div>
              <div className="px-2 py-1 rounded text-xs font-bold uppercase border w-full text-center bg-blue-100 text-blue-800 border-blue-200">
                {ticket.category?.name || ticket.category_id || "SEM CATEGORIA"}
              </div>
            </div>

            {/* Badge de Criticidade */}
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1 text-center">Prioridade</div>
              <div className={`px-2 py-1 rounded text-xs font-bold uppercase border w-full text-center ${getPriorityBadgeClasses()}`}>
                {ticket.priority?.name || "N/A"}
              </div>
            </div>
          </div>

          {/* Conteúdo principal do card */}
          <div className="flex-1 flex flex-col space-y-4 pr-6">
            {/* Header do Card: Número do chamado | Data e usuário criação */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {/* Ícone e Número do chamado */}
                <div className="flex items-center space-x-2">
                  <TicketIcon className="h-5 w-5 text-black" />
                  <div 
                    className="text-lg font-semibold text-black cursor-pointer hover:text-gray-700 transition-colors select-all"
                    title="Clique para copiar o número do chamado"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(ticket.external_id || '');
                    }}
                  >
                    {ticket.external_id}
                  </div>
                </div>
                
                {/* Badge de Privado se aplicável */}
                {!user?.is_client && ticket.is_private && (
                  <Badge variant="secondary" className="text-xs">
                    Privado
                  </Badge>
                )}
              </div>
              
              {/* Data e usuário de criação */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {ticket.created_at 
                    ? format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })
                    : "-"
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  por {getCreatedByName() || "-"}
                </p>
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {ticket.title || "Sem título"}
              </h3>
            </div>

            {/* Parceiro e Projeto em uma linha */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium truncate">
                {ticket.partner?.partner_desc || ticket.partner_id || "Sem parceiro"}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="font-medium truncate">
                {ticket.project?.projectName || ticket.project_id || "Sem projeto"}
              </span>
            </div>

            {/* Informações adicionais com labels alinhadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-2">
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Módulo:</span>
                  <span className="text-sm font-medium">
                    {ticket.module?.name || ticket.module_id || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Dt.Enc.:</span>
                  <span className="text-sm font-medium">
                    {ticket.actual_end_date ? format(new Date(ticket.actual_end_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Prev. Entrega:</span>
                  <span className="text-sm font-medium">
                    {ticket.planned_end_date ? format(new Date(ticket.planned_end_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Ticket Ref.:</span>
                  <span className="text-sm font-medium font-mono">
                    {ticket.ref_ticket_id ? `#${ticket.ref_ticket_id}` : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Ref. Externa:</span>
                  <span className="text-sm font-medium">
                    {ticket.ref_external_id || "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Recurso Princ.:</span>
                  <span className="text-sm font-medium text-green-700">
                    {getMainResourceName() || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <span className="text-xs text-muted-foreground text-right">Outros Recursos:</span>
                  <span className="text-sm font-medium">
                    {getOtherResourcesText() || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de ação na lateral direita */}
          <div className="flex flex-col space-y-2 pl-6 border-l border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenTicket}
              className="h-8 px-2"
              title="Abrir chamado em nova guia"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 data-[state=open]:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Mais
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={handleDetails}>
                  Detalhes
                </DropdownMenuItem>
                {canLinkResource && onLinkResource && (
                  <DropdownMenuItem onClick={handleLinkResource}>
                    <Users className="mr-2 h-4 w-4" />
                    Vincular Recurso
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}