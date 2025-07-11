"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Contract } from "@/types/contracts";
import { toast } from "sonner"

interface SmartbuildTableRowActionsProps<TData> {
  row: Row<TData>
}

export function SmartbuildTableRowActions<TData extends Contract>({
  row,
}: SmartbuildTableRowActionsProps<TData>) {
  const router = useRouter();  const handleOpenDetails = () => {
    const contractId = row.original.id;
    if (contractId) {
      // Armazenar os dados do projeto no sessionStorage
      sessionStorage.setItem(`project-${contractId}`, JSON.stringify(row.original));
      router.push(`/main/smartbuild/${contractId}`);
    }
  }
  const handleCloseProject = async () => {
    toast.info("Funcionalidade de encerrar projeto ainda não implementada.");
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
          <DropdownMenuItem onClick={handleOpenDetails}>Detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={handleCloseProject}>
            Encerrar Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
