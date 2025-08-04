"use client";

import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TicketHour } from "@/app/main/timesheet/management/columns";
import { AuthenticatedUser } from "@/lib/api-auth";
import { toast } from "sonner";
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

interface NestedTimesheetRowActionsProps {
  row: Row<TicketHour>;
  user: AuthenticatedUser;
}

export function NestedTimesheetRowActions({ row, user }: NestedTimesheetRowActionsProps) {
  const data = row.original;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/ticket-hours/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_deleted: true
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir apontamento');
      }

      toast.success("Apontamento excluído com sucesso");
      
      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Erro ao excluir apontamento. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Verificar se o usuário pode excluir (role 3 = functional, ou se for o próprio usuário)
  const canDelete = !user.is_client && (user.role === 3 || data.user_id === user.id);

  // Se é cliente ou não pode excluir, não mostra ação
  if (user.is_client || !canDelete) {
    return null;
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDeleteDialogOpen(true)}
        disabled={isDeleting}
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Excluir apontamento"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir Apontamento de Horas"
        description={`Tem certeza que deseja excluir este apontamento de ${Math.floor(data.minutes / 60)}h${String(data.minutes % 60).padStart(2, '0')}min? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
