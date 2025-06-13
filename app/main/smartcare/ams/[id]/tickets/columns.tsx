import { ColumnDef } from "@tanstack/react-table";
import type { Ticket } from "@/types/tickets";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Row } from "@tanstack/react-table";
import { ColoredBadge } from "@/components/ui/colored-badge";

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
    cell: ({ row }) => (
      <ColoredBadge value={row.original.status?.name} type="status" />
    ),
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
    cell: ({ row }) => (
      <ColoredBadge value={row.original.priority?.name} type="priority" />
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => (
      <ColoredBadge value={row.original.type?.name} type="ticket_type" />
    ),
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
    cell: ({ row }) => (
      <ColoredBadge value={row.original.is_closed} type="boolean" />
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
];

function ActionsCell({ row }: { row: Row<Ticket> }) {
  const ticket = row.original;
  const router = useRouter();
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
        <DropdownMenuItem
          onClick={() => {
              router.push(`/main/smartcare/management/${ticket.external_id}`);
            // router.push(`/main/smartbuild/${ticket.project_id}/${ticket.id}`);
          }}
        >
          Detalhes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
