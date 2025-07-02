"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { format } from "date-fns";
import { ColoredBadge } from "@/components/ui/colored-badge";
import { ChevronDown, ChevronRight } from 'lucide-react';

export type TimesheetRow = {
  id: string; // Usar appoint_date como id
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
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
  appoint_start?: string;
  appoint_end?: string;
  project?: {
    projectName: string;
    projectDesc: string;
  };
};

type TableMeta = {
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export const columns: ColumnDef<TimesheetRow>[] = [
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
    },
    {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions row={row} />,
    },
];
