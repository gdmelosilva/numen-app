"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "@/components/ui/data-table-row-actions"

export type User = {
  id: string
  first_name: string
  last_name: string
  email: string
  is_client: boolean
  tel_contact: string | null
  role: number | null
  partner_id: string | null
  created_at: string
  is_active: boolean
}

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    accessorKey: "partner_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parceiro" />
    ),
    cell: ({ row }) => {
      const partner = row.original.partner_id
      return partner ? partner : <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Função" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as number | null
      if (!role) return <Badge variant="outline">Sem função</Badge>

      // Convert role number to display name and variant
      const getRoleInfo = (roleNum: number): { name: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        switch (roleNum) {
          case 1:
        return { name: "Administrador", variant: "destructive" }
          case 2:
        return { name: "Gerente", variant: "default" }
          case 3: {
            const isClient = row.original.is_client;
            return isClient
              ? { name: "Key-User", variant: "secondary" }
              : { name: "Funcional", variant: "secondary" };
          }
          default:
        return { name: "Desconhecido", variant: "outline" }
        }
      }

      const roleInfo = getRoleInfo(role)
      return <Badge variant={roleInfo.variant}>{roleInfo.name}</Badge>
    },
  },
  {
    accessorKey: "is_client",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const isClient = row.getValue("is_client") as boolean
      return isClient ? "Cliente" : "Administrativo"
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
      const active = row.getValue("is_active") as boolean

      return (
        <Badge variant={active ? "default" : "secondary"}>
          {active ? (
            <CheckCircle2 className="mr-1 h-3 w-3" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          {active ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]