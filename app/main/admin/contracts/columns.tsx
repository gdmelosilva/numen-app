"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { ContractTableRowActions } from "@/components/contract-table-row-actions"
import type { Contract } from "@/types/contracts"
import { ColoredBadge } from "@/components/ui/colored-badge"

// Add types for actions
export interface ContractTableActionsContext {
  onEditOpen?: () => void;
  onEditClose?: () => void;
}

export const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: "projectExtId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Id.Contrato" />
    ),
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cód. Contrato" />
    ),
  },
  {
    accessorKey: "project_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("project_type") as string;
      return (
        <div className="text-center w-full">
          <ColoredBadge value={value} type="project_type" />
        </div>
      );
    },
  },
  {
    accessorKey: "projectDesc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descrição" />
    ),
  },
  {
    accessorKey: "partner_name.partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome Parceiro" />
    ),
  },
  {
    accessorKey: "project_status.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.project_status;
      return (
        <div className="text-center w-full">
          <ColoredBadge value={status} type="project_status" />
        </div>
      );
    },
  },
  {
    accessorKey: "is_wildcard",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wildcard?" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_wildcard") as boolean | string | null | undefined;
      return <ColoredBadge value={value} type="boolean" />;
    },
  },
  {
    accessorKey: "is_247",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="24/7?" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_247") as string | boolean | { name: string; color: string } | null | undefined;
      return <ColoredBadge value={value} type="boolean" />;
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data Inicial" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("start_date") as string;
      return value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    accessorKey: "end_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data Final" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("end_at") as string;
      return value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ContractTableRowActions row={row} />,
  },
  {
    accessorKey: "id",
    header: () => null,
    cell: () => null,
    enableHiding: false,
    enableSorting: false,
    meta: { hidden: true },
  }
]