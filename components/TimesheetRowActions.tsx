"use client";

import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react";
import { TimesheetRow } from "@/app/main/timesheet/management/columns";
import { AuthenticatedUser } from "@/lib/api-auth";
import { toast } from "sonner";

interface TimesheetRowActionsProps {
  row: Row<TimesheetRow>;
  user: AuthenticatedUser;
}

export function TimesheetRowActions({ row, user }: TimesheetRowActionsProps) {
  const data = row.original;

  const handleUpdate = () => {
    toast.info("Funcionalidade de atualização em desenvolvimento");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este apontamento?")) return;
    
    try {
      // Aqui implementar a lógica de exclusão
      toast.success("Apontamento excluído com sucesso");
    } catch {
      toast.error("Erro ao excluir apontamento");
    }
  };

  const handleApprove = async () => {
    try {
      // Aqui implementar a lógica de aprovação
      toast.success("Apontamento aprovado com sucesso");
    } catch {
      toast.error("Erro ao aprovar apontamento");
    }
  };

  const handleReject = async () => {
    try {
      // Aqui implementar a lógica de reprovação
      toast.success("Apontamento reprovado com sucesso");
    } catch {
      toast.error("Erro ao reprovar apontamento");
    }
  };

  // Determinar quais ações estão disponíveis baseado no perfil do usuário
  const canUpdate = !user.is_client && user.role === 3;
  const canDelete = !user.is_client && user.role === 3;
  const canApprove = !user.is_client && user.role !== 3;
  const canReject = !user.is_client && user.role !== 3;

  // Se é cliente, não mostra ações
  if (user.is_client) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUpdate && (
          <DropdownMenuItem onClick={handleUpdate}>
            <Edit className="mr-2 h-4 w-4" />
            Atualizar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        )}
        {canApprove && !data.is_approved && (
          <DropdownMenuItem onClick={handleApprove} className="text-green-600">
            <Check className="mr-2 h-4 w-4" />
            Aprovar
          </DropdownMenuItem>
        )}
        {canReject && data.is_approved && (
          <DropdownMenuItem onClick={handleReject} className="text-orange-600">
            <X className="mr-2 h-4 w-4" />
            Reprovar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
