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

export function getTicketColumns({ priorities, types, statuses }: {
  priorities: { id: string | number; name: string }[];
  types: { id: string | number; name: string }[];
  statuses: { id: string | number; name: string }[];
}): ColumnDef<Ticket>[] {
  return [
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
      accessorKey: "status_id",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status?.name ?? statuses.find(s => String(s.id) === String(row.original.status_id))?.name;
        return <ColoredBadge value={status} type="status" />;
      },
    },
    {
      accessorKey: "priority_id",
      header: "Prioridade",
      cell: ({ row }) => {
        const priority = row.original.priority?.name ?? priorities.find(p => String(p.id) === String(row.original.priority_id))?.name;
        return <ColoredBadge value={priority} type="priority" />;
      },
    },
    {
      accessorKey: "type_id",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.original.type?.name ?? types.find(t => String(t.id) === String(row.original.type_id))?.name;
        return <ColoredBadge value={type} type="ticket_type" />;
      },
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
}

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
              // router.push(`/main/smartcare/management/${ticket.id}`);
            router.push(`/main/smartbuild/${ticket.project_id}/${ticket.id}`);
          }}
        >
          Detalhes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
