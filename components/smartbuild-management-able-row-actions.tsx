"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Loader2 } from "lucide-react"
import React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { isTicketFinalized, getTicketFinalizedMessage } from "@/lib/ticket-status"
import type { Ticket } from "@/types/tickets"

interface SmartbuildTableRowActionsProps<TData> {
  row: Row<TData>
}

export function SmartbuildTableRowActions<TData>({
  row,
}: SmartbuildTableRowActionsProps<TData>) {
  const router = useRouter();
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [endDate, setEndDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [isClosing, setIsClosing] = React.useState(false);

  const handleOpenDetails = () => {
    const original = row.original as Record<string, unknown>;
    const id = typeof original === "object" && original !== null && "id" in original ? original.id : undefined;
    if (id) {
      sessionStorage.setItem(`project-${id}`, JSON.stringify(row.original));
      router.push(`/main/smartbuild/management/${id}`);
    }
  }

  const handleOpenCloseDialog = () => {
    const original = row.original as Record<string, unknown>;
    
    // Verifica se o ticket está finalizado antes de permitir outras ações
    if (isTicketFinalized(original as Ticket)) {
      return toast.info(getTicketFinalizedMessage());
    }
    
    // Para tickets, verificamos se já está fechado
    const isClosed = original && "is_closed" in original ? Boolean(original.is_closed) : false;
    
    if (isClosed) {
      return toast.info("O ticket já está fechado.");
    }
    
    setShowCloseDialog(true);
  }

  const handleConfirmClose = async () => {
    const original = row.original as Record<string, unknown>;
    const ticketId = typeof original === "object" && original !== null && "id" in original ? original.id : undefined;
    if (!ticketId) return toast.error("ID do ticket não encontrado.");
    
    setIsClosing(true);
    
    try {
      // Para tickets, usamos uma API diferente (exemplo de endpoint - ajustar conforme necessário)
      const res = await fetch(`/api/tickets/${ticketId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          end_date: endDate,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao encerrar ticket");
      }
      
      toast.success("Ticket encerrado com sucesso!");
      setShowCloseDialog(false);
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao encerrar ticket";
      toast.error(errorMsg);
    } finally {
      setIsClosing(false);
    }
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleOpenDetails}>Detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenCloseDialog}>
            Encerrar Ticket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Encerrar Ticket</DialogTitle>
            <DialogDescription>
              Defina a data de encerramento do ticket.
              <br />
              <strong className="text-orange-600">⚠️ Esta ação encerrará o ticket permanentemente!</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Data de Encerramento
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={isClosing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isClosing ? "Encerrando..." : "Encerrar Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
