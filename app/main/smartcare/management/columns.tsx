import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Ticket } from "@/types/tickets";
import { useRouter } from "next/navigation";

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "is_private",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Privado?" />
    ),
    cell: ({ row }) => row.original.is_private ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>,
  },
  {
    accessorKey: "external_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
  },
  {
    accessorKey: "project.projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contrato" />
    ),
    cell: ({ row }) => row.original.project?.projectName || row.original.project_id || "-",
  },
  {
    accessorKey: "partner.partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parceiro" />
    ),
    cell: ({ row }) => row.original.partner?.partner_desc || row.original.partner_id || "-",
  },
    {
    accessorKey: "category.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoria" />
    ),
    cell: ({ row }) => row.original.category?.name || row.original.category_id || "-",
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Título" />
    ),
  },
  {
    accessorKey: "module.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Módulo" />
    ),
    cell: ({ row }) => row.original.module?.name || row.original.module_id || "-",
  },
  {
    accessorKey: "status.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const name = status?.name || row.original.status_id || "-";
      return name !== "-" ? <ColoredBadge value={status} type="ticket_status" /> : "-";
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) => row.original.created_at ? format(new Date(row.original.created_at), "dd/MM/yyyy", { locale: ptBR }) : "-",
  },
  {
    accessorKey: "priority.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prioridade" />
    ),
    cell: ({ row }) => {
      const prioridade = row.original.priority?.name || row.original.priority_id || "-";
      let variant: "primary" | "outline" | "destructive" = "primary";
      if (typeof prioridade === "string") {
        if (prioridade.toLowerCase() === "alta") variant = "destructive";
        else if (prioridade.toLowerCase() === "baixa") variant = "outline";
        else variant = "primary";
      }
      return prioridade !== "-" ? <Badge variant={variant}>{prioridade}</Badge> : "-";
    },
  },
  {
    accessorKey: "planned_end_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prev. Fim" />
    ),
    cell: ({ row }) => row.original.planned_end_date ? format(new Date(row.original.planned_end_date), "dd/MM/yyyy", { locale: ptBR }) : "-",
  },
  {
    accessorKey: "resources",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recursos" />
    ),
    cell: ({ row }) => {
      const resources = row.original.resources || [];
      const count = resources.length;
      if (count === 0) {
        return <Badge variant="outline">0</Badge>;
      }
      
      const mainResource = resources.find(r => r.is_main);
      if (mainResource && mainResource.user) {
        const userName = `${mainResource.user.first_name || ""} ${mainResource.user.last_name || ""}`.trim() 
          || mainResource.user.email 
          || mainResource.user.id;
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="approved">{userName} (Principal)</Badge>
            {count > 1 && <Badge variant="secondary">+{count - 1} outros</Badge>}
          </div>
        );
      }
      
      return <Badge variant="secondary">{count} recurso{count > 1 ? 's' : ''}</Badge>;
    },
  },
  {
    id: "actions",
    cell: function ActionsCell({ row }) {
      const ticketId = row.original.external_id || row.original.id;
      const router = useRouter();
      const handleDetails = () => {
        if (ticketId) {
          router.push(`/main/smartcare/management/${ticketId}`);
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={handleDetails}>Detalhes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
