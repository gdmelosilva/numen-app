"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";

export type Partner = {
  id: string,
  partner_ext_id: string;
  partner_desc: string;
  partner_ident: string;
  partner_email: string;
  partner_tel: string;
  partner_segment: {
    name: string;
  };
  is_compadm: boolean;
  is_active: boolean;
};

export const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "partner_ext_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Id.Parceiro" />
    ),
  },
  {
    accessorKey: "partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
  },
  {
    accessorKey: "partner_ident",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Identificação" />
    ),
  },
  {
    accessorKey: "partner_email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "partner_tel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telefone" />
    ),
  },
  {
    accessorKey: "partner_segment.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Segmento" />
    ),
  },
  {
    accessorKey: "is_compadm",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo Parceiro" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_compadm") as boolean;
      const label = value ? "Administrativo" : "Cliente";
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const value = row.getValue("is_active") as boolean;
      const label = value ? "Ativo" : "Inativo";
      return (
        <Badge variant={value ? "approved" : "secondary"}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "id",
    header: () => null,
    cell: () => null,
    enableHiding: false,
    enableSorting: false,
    meta: { hidden: true },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
