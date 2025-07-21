import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { Contract } from "@/types/contracts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { ColoredBadge } from '@/components/ui/colored-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

interface AMSProjectTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function AMSProjectTableRowActions<TData extends Contract>({ row }: Readonly<AMSProjectTableRowActionsProps<TData>>) {
  const router = useRouter();
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [endDate, setEndDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [isClosing, setIsClosing] = React.useState(false);

  const handleOpenDetails = () => {
    const contractId = row.original.id;
    if (contractId) {
      sessionStorage.setItem(`project-${contractId}`, JSON.stringify(row.original));
      router.push(`/main/smartcare/ams/${contractId}`);
    }
  };

  const handleOpenCloseDialog = () => {
    // Verifica se já está encerrado antes de abrir o dialog
    const currentStatus = (typeof row.original.project_status === "object" && row.original.project_status !== null && "name" in row.original.project_status)
      ? String((row.original.project_status as { name?: string }).name ?? "").toLowerCase()
      : String(row.original.project_status ?? "").toLowerCase();
    
    if (currentStatus.includes("encerr")) {
      return toast.info("O projeto já está encerrado.");
    }
    
    setShowCloseDialog(true);
  };

  const handleConfirmClose = async () => {
    const contractId = row.original.id;
    if (!contractId) return toast.error("ID do projeto não encontrado.");
    
    setIsClosing(true);
    
    try {
      // Buscar status 'Encerrado'
      const statusRes = await fetch("/api/options?type=project_status");
      const statuses: { id: string; name: string }[] = await statusRes.json();
      const encerrado = statuses.find((s) => s.name.toLowerCase().includes("encerr"));
      if (!encerrado) return toast.error("Status 'Encerrado' não encontrado.");

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
          end_at: endDate,
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
      setShowCloseDialog(false);
      router.refresh();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao encerrar projeto";
      toast.error(errorMsg);
    } finally {
      setIsClosing(false);
    }
  };
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
          <DropdownMenuItem onClick={handleOpenCloseDialog}>
            Encerrar Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Encerrar Projeto</DialogTitle>
            <DialogDescription>
              Defina a data de encerramento do projeto.
              <br />
              <strong className="text-orange-600">⚠️ Os tickets relacionados também serão encerrados!</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Data de Encerramento
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={isClosing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isClosing ? "Encerrando..." : "Encerrar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: "projectExtId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Project.Id" />,
    cell: ({ row }) => row.original.projectExtId ?? "-",
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => <span>{row.original.projectName ?? "-"}</span>,
  },
  {
    accessorKey: "projectDesc",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
  },
  {
    accessorKey: "partnerId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Parceiro" />,
    cell: ({ row }) => row.original.partner && typeof row.original.partner === "object" && "partner_desc" in row.original.partner
      ? row.original.partner.partner_desc
      : row.original.partnerId ?? "-",
  },
  {
    accessorKey: "project_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => (
      <div className="text-center w-full">
        <ColoredBadge value={row.original.project_type} type="project_type" />
      </div>
    ),
  },
  {
    accessorKey: "project_status.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <ColoredBadge value={row.original.project_status} type="project_status" />
    ),
  },
  {
    accessorKey: "is_wildcard",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Wildcard?" />,
    cell: ({ row }) => (
      <ColoredBadge value={row.original.is_wildcard} type="boolean" />
    ),
  },
  {
    accessorKey: "is_247",
    header: ({ column }) => <DataTableColumnHeader column={column} title="24/7?" />,
    cell: ({ row }) => (
      <ColoredBadge value={row.original.is_247} type="boolean" />
    ),
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Início" />,
    cell: ({ row }) => row.original.start_date ? new Date(row.original.start_date).toLocaleDateString("pt-BR") : "-",
  },
  {
    accessorKey: "end_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fim" />,
    cell: ({ row }) => row.original.end_at ? new Date(row.original.end_at).toLocaleDateString("pt-BR") : "-",
  },
  {
    id: "actions",
    header: () => <span>Ações</span>,
    cell: ({ row }) => <AMSProjectTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
];
