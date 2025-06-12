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
  const router = useRouter();  const handleOpenDetails = () => {
    const contractId = row.original.id;
    if (contractId) {
      router.push(`/main/admin/contracts/${contractId}`);
    }
  }
  const handleCloseProject = async () => {
    const contractId = row.original.id;
    if (!contractId) return toast.error("ID do projeto não encontrado.");
    try {
      // Buscar status 'Encerrado'
      const statusRes = await fetch("/api/options?type=project_status");
      const statuses: { id: string; name: string }[] = await statusRes.json();
      const encerrado = statuses.find((s) => s.name.toLowerCase().includes("encerr"));
      if (!encerrado) return toast.error("Status 'Encerrado' não encontrado.");
      // Verifica se já está encerrado
      const currentStatus = (typeof row.original.project_status === "object" && row.original.project_status !== null && "name" in row.original.project_status)
        ? String((row.original.project_status as { name?: string }).name ?? "").toLowerCase()
        : String(row.original.project_status ?? "").toLowerCase();
      if (currentStatus.includes("encerr")) {
        return toast.info("O projeto já está encerrado.");
      }
      // Atualizar contrato
      const now = new Date();
      const endAt = now.toISOString().slice(0, 10); // YYYY-MM-DD
      // Garante que todos os campos essenciais sejam enviados
      const startDate = row.original.start_date ? String(row.original.start_date).slice(0, 10) : "";
      const projectName = row.original.projectName || "";
      const projectDesc = row.original.projectDesc || "";
      const partnerId = row.original.partnerId || (row.original.partner && row.original.partner.id) || "";
      const project_type = row.original.project_type || "";
      const is_wildcard = row.original.is_wildcard ?? false;
      const is_247 = row.original.is_247 ?? false;
      const res = await fetch("/api/admin/contracts/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contractId,
          project_status: encerrado.id,
          end_at: endAt,
          start_date: startDate,
          projectName,
          projectDesc,
          partnerId,
          project_type,
          is_wildcard,
          is_247,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao encerrar projeto");
      }
      toast.success("Projeto encerrado com sucesso!");
      // Opcional: recarregar página ou atualizar tabela
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao encerrar projeto";
      toast.error(errorMsg);
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
          <DropdownMenuItem onClick={handleCloseProject}>
            Encerrar Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
