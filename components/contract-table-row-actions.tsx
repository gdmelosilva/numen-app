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

interface ContractTableRowActionsProps<TData> {
  row: Row<TData>
}

export function ContractTableRowActions<TData extends Contract>({
  row,
}: ContractTableRowActionsProps<TData>) {
  const router = useRouter();
  const handleOpenDetails = () => {
    const contractId = row.original.id;
    if (contractId) {
      router.push(`/main/admin/contracts/${contractId}`);
    }
  }
  const handleCloseProject = async () => {
    // TODO: Implement API call to close/end the project
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
