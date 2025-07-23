"use client";

import React, { useState, useEffect } from "react";
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
}

export function TicketSelectionDialog({
  trigger,
  onSelect,
  selectedTicketId,
}: TicketSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open && tickets.length === 0) {
      fetchTickets();
    }
  }, [open, tickets.length]);

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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      console.log("Buscando tickets...");
      const response = await fetch("/api/smartcare");
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Tickets encontrados:", data?.length || 0);
        console.log("Primeiro ticket:", data?.[0]);
        setTickets(data || []);
        setFilteredTickets(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    } finally {
      setLoading(false);
    }
  };

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
                        <ColoredBadge type="ticket_status" value={String(ticket.status_id)} />
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
