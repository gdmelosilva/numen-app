"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Ticket {
  id: string;
  title: string;
  external_id: string;
  status_id: number;
  project?: {
    projectName: string;
  };
  status?: {
    name: string;
  };
}

interface TicketSelectionDialogProps {
  trigger: React.ReactNode;
  onSelect: (ticketId: string, ticketTitle: string) => void;
  selectedTicketId?: string;
  projectId?: string; // Opcional: filtrar tickets por projeto
  showInactive?: boolean;
}

export function TicketSelectionDialog({
  trigger,
  onSelect,
  selectedTicketId,
  projectId,
  showInactive = true,
}: TicketSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { statuses } = useTicketStatuses();
  const { user } = useCurrentUser();

  const getStatusName = (statusId: number): string => {
    const status = statuses.find(s => Number(s.id) === statusId);
    return status?.name || `Status ${statusId}`;
  };

  const fetchTickets = useCallback(async () => {
    if (!user) return; // Aguardar informações do usuário
    
    setLoading(true);
    try {
      console.log("Buscando tickets...");
      
      // Aplicar filtros baseados no perfil do usuário
      let apiUrl = "/api/smartcare";
      const params = new URLSearchParams();

      if (!user.is_client && user.role === 3) {
        // Role 3 (Recurso): Vê apenas tickets onde está alocado
        params.append("user_tickets", user.id);
      } else if (!user.is_client && user.role === 2) {
        // Role 2 (Manager): Vê tickets dos projetos que gerencia
        // TODO: Implementar filtro por projetos do manager
        // Por enquanto, vê todos os tickets
      } else if (!user.is_client && user.role === 1) {
        // Role 1 (Admin): Vê todos os tickets
        // Não aplica filtros adicionais
      } else if (user.is_client) {
        // Cliente: Vê apenas tickets dos seus projetos/parceiro
        if (user.partner_id) {
          params.append("partner_id", user.partner_id);
        }
      }

      // Filtro adicional por projeto se fornecido
      if (projectId) {
        params.append("project_id", projectId);
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await fetch(apiUrl);
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        // Só filtra se showInactive for false
        const filtered = showInactive
          ? (data || [])
          : (data || []).filter(
              (ticket: Ticket) => ticket.status_id !== 4 && ticket.status_id !== 14
            );
        setTickets(filtered);
        setFilteredTickets(filtered);
      }
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, showInactive]);

  useEffect(() => {
    if (open && user) {
      // Recarregar tickets sempre que o dialog abrir ou quando o projectId mudar
      setTickets([]);
      setFilteredTickets([]);
      fetchTickets();
    }
  }, [open, user, projectId, fetchTickets]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tickets.filter((ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.external_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.project?.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets(tickets);
    }
  }, [searchTerm, tickets]);

  const handleSelectTicket = (ticket: Ticket) => {
    onSelect(ticket.id, ticket.title);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Ticket Relacionado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por título, ID externo ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="h-[400px] w-full overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="text-center py-8">Carregando tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum ticket encontrado" : "Nenhum ticket disponível"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTicketId === ticket.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{ticket.external_id}
                        </span>
                        <ColoredBadge type="ticket_status" value={getStatusName(ticket.status_id)} />
                      </div>
                      <h4 className="font-medium text-sm leading-tight">
                        {ticket.title}
                      </h4>
                      {ticket.project?.projectName && (
                        <p className="text-xs text-muted-foreground">
                          Projeto: {ticket.project.projectName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
