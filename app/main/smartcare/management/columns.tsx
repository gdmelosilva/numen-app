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
import { AuthenticatedUser } from "@/lib/api-auth";

export const getColumns = (user?: AuthenticatedUser | null): ColumnDef<Ticket>[] => {
  const allColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "is_private",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Privado?" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.is_private ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "external_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    size: 120,
    minSize: 100,
    maxSize: 150,
  },
  {
    accessorKey: "ref_external_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ref.Ext." />
    ),
  },
  {
    id: "project",
    accessorKey: "project.projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Projeto" />
    ),
    size: 200,
    minSize: 150,
    maxSize: 250,
    cell: ({ row }) => row.original.project?.projectName || row.original.project_id || "-",
  },
  {
    id: "partner",
    accessorKey: "partner.partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parceiro" />
    ),
    size: 180,
    minSize: 150,
    maxSize: 220,
    cell: ({ row }) => row.original.partner?.partner_desc || row.original.partner_id || "-",
  },
    {
    id: "category",
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
    size: 20,
    minSize: 20,
    maxSize: 20,
  },
  {
    id: "module",
    accessorKey: "module.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Módulo Func." />
    ),
    cell: ({ row }) => row.original.module?.name || row.original.module_id || "-",
  },
  {
    id: "status",
    accessorKey: "status.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    size: 240,
    minSize: 240,
    maxSize: 240,
    cell: ({ row }) => {
      const status = row.original.status;
      const name = status?.name || row.original.status_id || "-";
      return (
        <div className="flex justify-center">
          {name !== "-" ? <ColoredBadge value={status} type="ticket_status" /> : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.created_at ? format(new Date(row.original.created_at), "dd/MM/yyyy", { locale: ptBR }) : "-"}
      </div>
    ),
  },
  {
    id: "priority",
    accessorKey: "priority.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prioridade" />
    ),
    cell: ({ row }) => {
      const priority = row.original.priority;
      const name = priority?.name || row.original.priority_id || "-";
      return (
        <div className="flex justify-center">
          {name !== "-" ? <ColoredBadge value={priority?.name} type="priority" /> : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "planned_end_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prev. Fim" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.planned_end_date ? format(new Date(row.original.planned_end_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
      </div>
    ),
  },
  {
    id: "main_resource",
    accessorKey: "main_resource",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Recurso Principal" />
    ),
    size: 180,
    minSize: 150,
    maxSize: 220,
    cell: ({ row }) => {
      const resources = row.original.resources || [];
      const mainResource = resources.find(r => r.is_main);
      
      if (mainResource && mainResource.user) {
        const userName = `${mainResource.user.first_name || ""} ${mainResource.user.last_name || ""}`.trim() 
          || mainResource.user.email 
          || mainResource.user.id;
        return (
          <div className="flex justify-center">
            <Badge variant="approved">{userName}</Badge>
          </div>
        );
      }
      
      return (
        <div className="flex justify-center">
          <Badge variant="outline">-</Badge>
        </div>
      );
    },
  },
  {
    id: "other_resources", 
    accessorKey: "other_resources",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Demais Recursos" />
    ),
    size: 160,
    minSize: 130,
    maxSize: 200,
    cell: ({ row }) => {
      const resources = row.original.resources || [];
      const otherResources = resources.filter(r => !r.is_main);
      const count = otherResources.length;
      
      if (count === 0) {
        return (
          <div className="flex justify-center">
            <Badge variant="outline">-</Badge>
          </div>
        );
      }
      
      if (count === 1 && otherResources[0].user) {
        const userName = `${otherResources[0].user.first_name || ""} ${otherResources[0].user.last_name || ""}`.trim() 
          || otherResources[0].user.email 
          || otherResources[0].user.id;
        return (
          <div className="flex justify-center">
            <Badge variant="secondary">{userName}</Badge>
          </div>
        );
      }
      
      return (
        <div className="flex justify-center">
          <Badge variant="secondary">{count} recurso{count > 1 ? 's' : ''}</Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
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

  // Filtrar colunas baseado no tipo de usuário
  if (user?.is_client) {
    // Para clientes, remover a coluna "is_private" (índice 0)
    return allColumns.filter((_, index) => index !== 0);
  }

  return allColumns;
};

// Manter compatibilidade com importações existentes
export const columns = getColumns();
