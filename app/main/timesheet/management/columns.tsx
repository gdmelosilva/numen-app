"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { format } from "date-fns";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { AuthenticatedUser } from "@/lib/api-auth";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TimesheetRowActions } from "@/components/TimesheetRowActions";

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
  ticket_id?: string;
  project_id?: string;
  ticket_title?: string;
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

export const getColumns = (user: AuthenticatedUser | null): ColumnDef<TimesheetRow>[] => {
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
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
    },
    {
        accessorKey: "total_minutes",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Horas Apontadas" />
        ),
        cell: ({ getValue }) => {
            const minutes = getValue() as number;
            const hours = (minutes / 60).toFixed(2);
            return <span>{hours} h</span>;
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

  // Adicionar coluna de ações baseada no perfil do usuário
  if (user && !user.is_client) {
    baseColumns.push({
      id: "actions",
      cell: ({ row }) => <TimesheetRowActions row={row} user={user} />,
    });
  }

  return baseColumns;
};

export const getChildColumns = (user: AuthenticatedUser | null): ColumnDef<TicketHour>[] => {
  const childColumns: ColumnDef<TicketHour>[] = [
    {
      accessorKey: "appoint_start",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Início" />
      ),
      cell: ({ getValue }) => {
        const time = getValue() as string;
        return <span>{time || "-"}</span>;
      },
    },
    {
      accessorKey: "appoint_end", 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fim" />
      ),
      cell: ({ getValue }) => {
        const time = getValue() as string;
        return <span>{time || "-"}</span>;
      },
    }
  ];

  // Adicionar coluna de usuário apenas para administradores (role 1) não-clientes
  if (user && !user.is_client && user.role === 1) {
    childColumns.push({
      accessorKey: "user_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usuário" />
      ),
      cell: ({ getValue }) => {
        const userName = getValue() as string;
        return <span>{userName || "-"}</span>;
      },
    });
  }

  childColumns.push(
    {
      accessorKey: "minutes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Horas" />
      ),
      cell: ({ getValue }) => {
        const minutes = getValue() as number;
        const hours = (minutes / 60).toFixed(2);
        return <span>{hours} h</span>;
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
  );

  // Adicionar ações apenas para usuários não-clientes
  if (user && !user.is_client) {
    childColumns.push({
      id: "actions",
      cell: ({ row }) => <TimesheetRowActions row={row} user={user} />,
    });
  }

  return childColumns;
};
