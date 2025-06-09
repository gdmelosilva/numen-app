"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserEditDialog } from "@/components/UserEditDialog"
import type { User } from "@/types/users"

interface UserTableRowActionsProps<TData> {
  row: Row<TData>
  onEditOpen?: () => void
  onEditClose?: () => void
}

export function UserTableRowActions<TData extends User>({
  row,
  onEditOpen,
  onEditClose,
}: UserTableRowActionsProps<TData>) {
  const [editOpen, setEditOpen] = React.useState(false)
  const handleOpenEdit = () => {
    setEditOpen(true)
    onEditOpen?.()
  }
  const handleCloseEdit = () => {
    setEditOpen(false)
    onEditClose?.()
  }
  return (
    <>
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
          <DropdownMenuItem onClick={handleOpenEdit}>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Inativar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editOpen && (
        <UserEditDialog
          user={row.original}
          onSuccess={handleCloseEdit}
        />
      )}
    </>
  )
}
