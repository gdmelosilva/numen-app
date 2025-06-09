"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserEditDialog } from "@/components/UserEditDialog"
import { banUser, unbanUser } from "@/lib/api-user-ban"
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
  const handleToggleActive = async () => {
    const user = row.original as User
    const userId = user.id
    if (!userId) return
    let result
    if (user.is_active) {
      result = await banUser(userId)
      if (result.success) toast.success("Usuário inativado com sucesso")
      else toast.error(result.error || "Erro ao inativar usuário")
    } else {
      result = await unbanUser(userId)
      if (result.success) toast.success("Usuário ativado com sucesso")
      else toast.error(result.error || "Erro ao ativar usuário")
    }
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
          <DropdownMenuItem onClick={handleToggleActive}>
            {row.original.is_active ? "Inativar" : "Ativar"}
          </DropdownMenuItem>
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
