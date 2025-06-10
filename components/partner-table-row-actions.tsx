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
import { activatePartner, deactivatePartner } from "@/lib/api-partner-activate"
import type { Partner } from "@/types/partners"
import { toast } from "sonner"

interface PartnerTableRowActionsProps<TData> {
  row: Row<TData>
}

export function PartnerTableRowActions<TData extends Partner>({
  row,
}: PartnerTableRowActionsProps<TData>) {
  const router = useRouter();
  const handleOpenDetails = () => {
    const partnerId = row.original.id;
    if (partnerId) {
      router.push(`/main/admin/partners/${partnerId}`);
    }
  }
  const handleToggleActive = async () => {
    const partner = row.original as Partner;
    const partnerId = partner.id;
    if (!partnerId) return;
    let result;
    if (partner.is_active) {
      result = await deactivatePartner(partnerId);
      if (result.success) {
        toast.success("Parceiro inativado com sucesso");
      } else {
        toast.error(result.error || "Erro ao inativar parceiro");
      }
    } else {
      result = await activatePartner(partnerId);
      if (result.success) {
        toast.success("Parceiro ativado com sucesso");
      } else {
        toast.error(result.error || "Erro ao ativar parceiro");
      }
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
          <DropdownMenuItem onClick={handleOpenDetails}>Detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {row.original.is_active ? "Inativar" : "Ativar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
