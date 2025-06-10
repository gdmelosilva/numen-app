"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "@/components/ui/data-table-row-actions"

export type Project = {
  id?: string | number;
  projectExtId: string;
  projectName: string;
  projectDesc: string;
  partnerId: string;
  partner_name: {
    partner_desc: string;
  };
  project_type: string;
  project_status: string;
  is_wildcard: boolean | null;
  is_247: boolean | null;
  start_date: string;
  end_at: string;
};

// Add types for actions
export interface ProjectTableActionsContext {
  onEditOpen?: () => void;
  onEditClose?: () => void;
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "projectExtId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID Externo" />
    ),
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome do Projeto" />
    ),
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
    accessorKey: "project_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
  },
  {
    accessorKey: "project_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
  {
    accessorKey: "is_wildcard",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Wildcard?" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_wildcard") as boolean | null;
      return value === null ? <span className="text-muted-foreground">-</span> : value ? "Sim" : "Não";
    },
  },
  {
    accessorKey: "is_247",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="24/7?" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_247") as boolean | null;
      return value === null ? <span className="text-muted-foreground">-</span> : value ? "Sim" : "Não";
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
      cell: ({ row }) => <DataTableRowActions row={row} />,
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