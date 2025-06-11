import { ColumnDef } from "@tanstack/react-table";
import type { Ticket } from "@/types/tickets";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "external_id",
    header: "ID",
    cell: ({ row }) => String(row.original.external_id).padStart(5, "0"),
  },
  {
    accessorKey: "title",
    header: "Título",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.original.status?.name || "-",
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
    cell: ({ row }) => row.original.priority?.name || "-",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => row.original.type?.name || "-",
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) =>
      row.original.created_at
        ? new Date(row.original.created_at).toLocaleDateString("pt-BR")
        : "-",
  },
  {
    accessorKey: "is_closed",
    header: "Fechado?",
    cell: ({ row }) =>
      row.original.is_closed ? (
        <Badge variant="secondary">Sim</Badge>
      ) : (
        <Badge variant="outline">Não</Badge>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const ticket = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem asChild>
              <a
                href={`/main/smartbuild/management/${ticket.project_id}/tickets/${ticket.id}`}
              >
                Detalhes
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
