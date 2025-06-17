"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { format } from "date-fns";
import { ColoredBadge } from "@/components/ui/colored-badge";

export type TimesheetRow = {
  id: string; // Usar appoint_date como id
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
};

export const columns: ColumnDef<TimesheetRow>[] = [
    {
        accessorKey: "appoint_date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Data" />
        ),
        cell: ({ getValue }) => {
            const date = getValue() as string;
            return <span>{format(new Date(date), "dd/MM/yyyy")}</span>;
        },
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
