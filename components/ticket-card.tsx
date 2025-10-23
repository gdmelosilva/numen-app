"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Users, ExternalLink, Calendar, User, Building, Tag, AlertCircle } from "lucide-react";
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

  return (
    <Card 
      className="ticket-card cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Header do Card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="font-mono text-sm">
                  #{ticket.external_id}
                </Badge>
                {ticket.ref_external_id && (
                  <Badge variant="secondary" className="text-xs">
                    Ref: {ticket.ref_external_id}
                  </Badge>
                )}
                {!user?.is_client && ticket.is_private && (
                  <Badge variant="secondary" className="text-xs">
                    Privado
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenTicket}
                className="h-8 w-8 p-0"
                title="Abrir chamado em nova guia"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
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

          {/* Título */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {ticket.title || "Sem título"}
            </h3>
          </div>

          {/* Informações principais em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Coluna 1: Projeto e Parceiro */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Parceiro</p>
                  <p className="text-sm font-medium truncate" title={ticket.partner?.partner_desc}>
                    {ticket.partner?.partner_desc || ticket.partner_id || "-"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Projeto</p>
                  <p className="text-sm font-medium truncate" title={ticket.project?.projectName}>
                    {ticket.project?.projectName || ticket.project_id || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna 2: Status e Prioridade */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center">
                    {ticket.status?.name ? (
                      <ColoredBadge value={ticket.status} type="ticket_status" />
                    ) : (
                      <Badge variant="outline">-</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Prioridade</p>
                  <div className="flex items-center">
                    {ticket.priority?.name ? (
                      <ColoredBadge value={ticket.priority?.name} type="priority" />
                    ) : (
                      <Badge variant="outline">-</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 3: Datas e Criado por */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium">
                    {ticket.created_at 
                      ? format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Criado por</p>
                  <p className="text-sm font-medium truncate" title={getCreatedByName() || undefined}>
                    {getCreatedByName() || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações adicionais em linha */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-xs text-muted-foreground min-w-fit">Categoria:</span>
                <span className="text-sm font-medium text-left">
                  {ticket.category?.name || ticket.category_id || "-"}
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-xs text-muted-foreground min-w-fit">Módulo:</span>
                <span className="text-sm font-medium text-left">
                  {ticket.module?.name || ticket.module_id || "-"}
                </span>
              </div>
              {ticket.planned_end_date && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Prev. Fim:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(ticket.planned_end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {ticket.actual_end_date && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Fim Real:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(ticket.actual_end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {getMainResourceName() && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Recurso Principal:</span>
                  <Badge variant="approved" className="text-xs">
                    {getMainResourceName()}
                  </Badge>
                </div>
              )}
              {getOtherResourcesText() && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Outros Recursos:</span>
                  <Badge variant="secondary" className="text-xs">
                    {getOtherResourcesText()}
                  </Badge>
                </div>
              )}
              {ticket.type?.name && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Tipo:</span>
                  <span className="text-sm font-medium">
                    {ticket.type.name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {ticket.ref_ticket_id && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Ticket Ref.:</span>
                  <span className="text-sm font-medium font-mono">
                    #{ticket.ref_ticket_id}
                  </span>
                </div>
              )}
              {ticket.description && (
                <div className="flex items-start space-x-2">
                  <span className="text-xs text-muted-foreground min-w-fit">Descrição:</span>
                  <span className="text-sm text-muted-foreground line-clamp-2" title={ticket.description}>
                    {ticket.description}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}