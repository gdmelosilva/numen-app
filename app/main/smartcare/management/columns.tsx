import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { MoreHorizontal, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Ticket } from "@/types/tickets";
import { useRouter } from "next/navigation";
import { AuthenticatedUser } from "@/lib/api-auth";

export const getColumns = (
  user?: AuthenticatedUser | null,
  onLinkResource?: (ticket: Ticket) => void
): ColumnDef<Ticket>[] => {
  const allColumns: ColumnDef<Ticket>[] = [
  {
    id: "open_ticket",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Abrir" />
    ),
    cell: ({ row }) => {
      const ticketId = row.original.external_id || row.original.id;
      
      const handleOpenTicket = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que o clique da linha seja acionado
        if (ticketId) {
          const url = `/main/smartcare/management/${ticketId}`;
          window.open(url, '_blank');
        }
      };

      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenTicket}
            className="h-8 w-8 p-0"
            title="Abrir chamado em nova guia"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
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
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.original.project?.projectName || row.original.project_id || "-"}>
        {row.original.project?.projectName || row.original.project_id || "-"}
      </div>
    ),
  },
  {
    id: "partner",
    accessorKey: "partner.partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parceiro" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate" title={row.original.partner?.partner_desc || row.original.partner_id || "-"}>
        {row.original.partner?.partner_desc || row.original.partner_id || "-"}
      </div>
    ),
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
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate" title={row.original.title || "-"}>
        {row.original.title || "-"}
      </div>
    ),
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
    id: "created_by",
    accessorKey: "created_by_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado Por" />
    ),
    cell: ({ row }) => {
      const createdByUser = row.original.created_by_user;
      if (createdByUser) {
        const name = createdByUser.first_name && createdByUser.last_name 
          ? `${createdByUser.first_name} ${createdByUser.last_name}`
          : createdByUser.name || createdByUser.id;
        return <div className="text-sm">{name}</div>;
      }
      return <div className="text-sm text-muted-foreground">-</div>;
    },
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
      const ticket = row.original;
      const router = useRouter();
      
      const handleDetails = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (ticketId) {
          router.push(`/main/smartcare/management/${ticketId}`);
        }
      };

      const handleLinkResource = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (onLinkResource) {
          onLinkResource(ticket);
        }
      };

      // Verificar se o usuário pode vincular recursos (admin-adm ou manager-adm)
      const canLinkResource = user && !user.is_client && (
        user.role === 1 || // admin-adm
        user.role === 2    // manager-adm (assumindo que role 2 é manager-adm)
      );

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={handleDetails}>
                Detalhes
              </DropdownMenuItem>
              {canLinkResource && onLinkResource && (
                <DropdownMenuItem onClick={handleLinkResource}>
                  <Users className="mr-2 h-4 w-4" />
                  Vincular Recurso
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

  // Filtrar colunas baseado no tipo de usuário
  if (user?.is_client) {
    // Para clientes, remover a coluna "is_private"
    return allColumns.filter((col) => 
      !('accessorKey' in col && col.accessorKey === "is_private")
    );
  }

  return allColumns;
};

// Manter compatibilidade com importações existentes
export const columns = getColumns();
