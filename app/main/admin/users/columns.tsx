"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ColoredBadge } from "@/components/ui/colored-badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { UserTableRowActions } from "@/components/user-table-row-actions"

export type User = import("@/types/users").User

// Add types for actions
export interface UserTableActionsContext {
  onEditOpen?: () => void;
  onEditClose?: () => void;
}

export const columns: ColumnDef<User>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="translate-y-[2px]"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => {
      const firstName = row.original.first_name
      const lastName = row.original.last_name
      return `${firstName} ${lastName}`
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "tel_contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telefone" />
    ),
    cell: ({ row }) => {
      const tel = row.getValue("tel_contact") as string | null
      return tel || "-"
    },
  },
  {
    accessorKey: "partner_desc",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parceiro" />
    ),
    cell: ({ row }) => {
      const partner = row.original.partner_desc;
      return partner ? partner : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Função" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as number | null;
      const isClient = row.original.is_client;
      let cargo = "Indefinido";
      if (role === 1) cargo = "Administrador";
      else if (role === 2) cargo = "Gerente";
      else if (role === 3 && isClient === true) cargo = "Key-User";
      else if (role === 3 && isClient === false) cargo = "Funcional";
      else if (isClient === true) cargo = "Cliente";
      else if (isClient === false) cargo = "Administrativo";
      return <ColoredBadge value={cargo} type="user_role" />;
    },
  },
  {
    accessorKey: "is_client",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const isClient = row.getValue("is_client") as boolean | string | { name: string; color: string } | null | undefined;
      return <ColoredBadge value={isClient} type="is_client" />;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data de criação" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return format(date, "dd/MM/yyyy", { locale: ptBR })
    },
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const active = row.getValue("is_active") as string | boolean | { name: string; color: string } | null | undefined;
      return <ColoredBadge value={active} type="status" />;
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
    cell: ({ row, table }) => {
      // Try to get onEditOpen/onEditClose from table.options.meta if provided
      const meta = (table.options.meta as UserTableActionsContext) || {};
      return <UserTableRowActions<User> row={row} onEditOpen={meta.onEditOpen} onEditClose={meta.onEditClose} />;
    },
  },
]