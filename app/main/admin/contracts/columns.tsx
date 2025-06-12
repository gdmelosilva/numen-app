"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { ContractTableRowActions } from "@/components/contract-table-row-actions"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"
import type { Contract } from "@/types/contracts"



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
    accessorKey: "project_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("project_type") as string;
      const typeColorMap: Record<string, "accent" | "secondary" | "outline" | "default" | "primary" | "approved"> = {
        "AMS": "accent",
        "BSHOP": "primary",
        "TKEY": "approved",
      };
      const typeLabelMap: Record<string, string> = {
        "AMS": "AMS",
        "BSHOP": "Bodyshop",
        "TKEY": "Turnkey",
      };
      const variant = typeColorMap[value] ?? "default";
      const label = typeLabelMap[value] ?? (value || "-");
      return (
        <div className="text-center w-full">
          <Badge variant={variant}>{label}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cód. Contrato" />
    ),
  },
  {
    accessorKey: "projectDesc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
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
      const name = status?.name || "-";
      const color = status?.color || "default";
      const variantMap: Record<string, "default" | "destructive" | "secondary" | "outline" | "ghost" | "approved" | "accent" |  "primary" | "primary-2"> = {
        cyan: "approved",
        purple: "accent",
        red: "destructive",
        gray: "secondary",
        colorless: "outline",
        orange: "primary",
        blue: "primary-2"
      };
      const variant = variantMap[color] ?? "outline";
      return (
        <div className="text-center w-full">
          <Badge variant={variant}>{name}</Badge>
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
      const value = row.getValue("is_wildcard") as boolean | null;
      return value === null 
        ? <span className="text-muted-foreground">-</span> 
        : value 
          ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 inline text-approved" />Sim
              </span>
            )
          : (
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 inline text-destructive" />Não
              </span>
            )
    },
  },
  {
    accessorKey: "is_247",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="24/7?" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_247") as boolean | null;
      return value === null
        ? <span className="text-muted-foreground">-</span> 
        : value 
          ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 inline text-approved" />Sim
              </span>
            )
          : (
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 inline text-destructive" />Não
              </span>
            )
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