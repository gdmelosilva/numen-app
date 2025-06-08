"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Copy, Trash } from "lucide-react"
import { Role } from "./columns"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RoleDataTableRowActionsProps {
  row: Row<Role>
}

export function RoleDataTableRowActions({
  row,
}: RoleDataTableRowActionsProps) {
  const role = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          Editar função
        </DropdownMenuItem>
        <DropdownMenuItem disabled={role.is_system_role}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar função
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600"
          disabled={role.is_system_role}
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir função
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}