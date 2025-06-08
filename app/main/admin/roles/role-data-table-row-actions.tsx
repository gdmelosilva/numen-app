"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { Role } from "@/types/roles"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RoleDataTableRowActionsProps {
  row: Row<Role>
}

export function RoleDataTableRowActions({
}: RoleDataTableRowActionsProps) {
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
        <DropdownMenuItem 
          className="text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Excluir função
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}