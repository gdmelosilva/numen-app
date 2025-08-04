"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { format } from "date-fns";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { AuthenticatedUser } from "@/lib/api-auth";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NestedTimesheetRowActions } from "@/components/NestedTimesheetRowActions";

export type TimesheetRow = {
  id: string; // Usar appoint_date como id
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
  user_name?: string;
  user_id?: string;
  project: {
    projectName: string;
    projectDesc: string;
  };
  children?: TicketHour[];
};

export type TicketHour = {
  id: string;
  appoint_date: string;
  minutes: number;
  is_approved: boolean;
  is_deleted: boolean;
  ticket_id?: string;
  project_id?: string;
  ticket_title?: string;
  ticket_type_id?: number;
  ticket_external_id?: string;
  appoint_start?: string;
  appoint_end?: string;
  user_name?: string;
  user_id?: string;
  project?: {
    projectName: string;
    projectDesc: string;
  };
};

type TableMeta = {
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export const getColumns = (): ColumnDef<TimesheetRow>[] => {
  const baseColumns: ColumnDef<TimesheetRow>[] = [
    {
        id: 'expander',
        header: '',
        cell: ({ row, table }) => {
          const meta = table.options.meta as TableMeta | undefined;
          const expanded = meta?.expanded?.[row.original.id];
          const setExpanded = meta?.setExpanded;
          const hasChildren = row.original.children && row.original.children.length > 0;
          return hasChildren ? (
            <button
              aria-label={expanded ? 'Colapsar' : 'Expandir'}
              onClick={e => {
                e.stopPropagation();
                if (setExpanded) setExpanded((prev: Record<string, boolean>) => ({ ...prev, [row.original.id]: !expanded }));
              }}
              className={`
                rounded-sm p-1 transition-colors duration-200
                hover:bg-muted/40 dark:hover:bg-muted/20
                ${expanded ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' : 'text-muted-foreground'}
              `.trim()}
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : null;
        },
        size: 32,
        minSize: 32,
        maxSize: 32,
    },
    {
        accessorKey: "appoint_date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Data" />
        ),
        cell: ({ getValue }) => {
            const date = getValue() as string;
            const parseUTCDateAsLocal = (utcDateString: string) => {
                const datePart = utcDateString.split('T')[0];
                const [year, month, day] = datePart.split('-').map(Number);
                return new Date(year, month - 1, day);
            };
            return <span>{format(parseUTCDateAsLocal(date), "dd/MM/yyyy")}</span>;
        },
    },
    {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />, 
      accessorFn: (row) => row.project?.projectName || "",
      id: "descricao",
      cell: ({ row }) => {
        const children = row.original.children;
        if (!children || children.length === 0) {
          return <span>-</span>;
        }

        // Verificar se há múltiplos projetos
        const uniqueProjects = new Set(children.map(child => child.project?.projectName).filter(Boolean));
        const uniqueUsers = new Set(children.map(child => child.user_name).filter(Boolean));
        
        if (uniqueProjects.size > 1) {
          return (
            <span className="text-sm text-muted-foreground">
              {uniqueProjects.size} projetos, {children.length} apontamento{children.length > 1 ? 's' : ''}
            </span>
          );
        } else if (uniqueUsers.size > 1) {
          const projectName = Array.from(uniqueProjects)[0] || "Projeto";
          return (
            <span className="text-sm">
              {projectName} ({uniqueUsers.size} usuários)
            </span>
          );
        } else {
          const projectName = Array.from(uniqueProjects)[0] || "Projeto";
          return (
            <span className="max-w-[200px] truncate inline-block" title={projectName}>
              {projectName}
            </span>
          );
        }
      },
    },
    {
        accessorKey: "total_minutes",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Horas Apontadas" />
        ),
        cell: ({ getValue }) => {
            const minutes = getValue() as number;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} h`;
            return <span>{formattedTime}</span>;
        },
    },
    {
        accessorKey: "is_approved",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Aprovação" />
        ),
        cell: ({ getValue }) => {
            const approved = getValue() as boolean;
            return approved ? (
                <ColoredBadge type="boolean" value={true} />
            ) : (
                <ColoredBadge type="boolean" value={false} />
            );
        },
    }
  ];

  // Não adicionar coluna de ações para a linha principal (do dia)
  // As ações ficam apenas na tabela aninhada (nos registros individuais)

  return baseColumns;
};

export const getChildColumns = (user: AuthenticatedUser | null): ColumnDef<TicketHour>[] => {
  const childColumns: ColumnDef<TicketHour>[] = [
    {
      accessorKey: "project.projectName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Projeto" />
      ),
      cell: ({ row }) => {
        const projectName = row.original.project?.projectName || "-";
        return (
          <span className="max-w-[150px] truncate inline-block" title={projectName}>
            {projectName}
          </span>
        );
      },
    },
    {
      accessorKey: "ticket_title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ticket" />
      ),
      cell: ({ row }) => {
        const ticketTitle = row.original.ticket_title || "-";
        const ticketId = row.original.ticket_id;
        const projectId = row.original.project_id;
        const ticketTypeId = row.original.ticket_type_id;
        const ticketExternalId = row.original.ticket_external_id;
        
        // Apenas administradores (role 1) não-clientes podem ver o link
        if (user && !user.is_client && user.role === 1 && ticketId && projectId && ticketTypeId && ticketExternalId) {
          let ticketLink: string;
          
          // Tipo 1 = smartcare, Tipo 2 = smartbuild
          if (ticketTypeId === 1) {
            ticketLink = `/main/smartcare/management/${ticketExternalId}`;
          } else if (ticketTypeId === 2) {
            ticketLink = `/main/smartbuild/${projectId}/${ticketId}`;
          } else {
            // Default para smartbuild se tipo não reconhecido
            ticketLink = `/main/smartbuild/${projectId}/${ticketId}`;
          }
          
          return (
            <a 
              href={ticketLink}
              className="text-blue-600 hover:text-blue-800 underline max-w-[200px] truncate inline-block"
              title={ticketTitle}
            >
              {ticketTitle}
            </a>
          );
        }
        
        return (
          <span className="max-w-[200px] truncate inline-block" title={ticketTitle}>
            {ticketTitle}
          </span>
        );
      },
    },
    {
      accessorKey: "appoint_start",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Início" />
      ),
      cell: ({ getValue }) => {
        const time = getValue() as string;
        return <span className="font-mono text-xs">{time || "-"}</span>;
      },
    },
    {
      accessorKey: "appoint_end", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fim" />
      ),
      cell: ({ getValue }) => {
        const time = getValue() as string;
        return <span className="font-mono text-xs">{time || "-"}</span>;
      },
    },
    {
      accessorKey: "minutes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Horas" />
      ),
      cell: ({ getValue }) => {
        const minutes = getValue() as number;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} h`;
        return <span className="font-mono text-xs">{formattedTime}</span>;
      },
    },
    {
      accessorKey: "is_approved",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const approved = getValue() as boolean;
        return approved ? (
          <ColoredBadge type="boolean" value={true} />
        ) : (
          <ColoredBadge type="boolean" value={false} />
        );
      },
    }
  ];

  // Adicionar coluna de usuário para administradores (role 1) e gerentes administrativos (role 2) não-clientes
  if (user && !user.is_client && (user.role === 1 || user.role === 2)) {
    childColumns.splice(-1, 0, {
      accessorKey: "user_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usuário" />
      ),
      cell: ({ getValue }) => {
        const userName = getValue() as string;
        return (
          <span className="max-w-[120px] truncate inline-block" title={userName || "-"}>
            {userName || "-"}
          </span>
        );
      },
    });
  }

  // Adicionar ações apenas para usuários não-clientes
  if (user && !user.is_client) {
    childColumns.push({
      id: "actions",
      header: () => <span className="text-xs">Ações</span>,
      cell: ({ row }) => <NestedTimesheetRowActions row={row} user={user} />,
      size: 60,
      minSize: 60,
      maxSize: 60,
    });
  }

  return childColumns;
};
