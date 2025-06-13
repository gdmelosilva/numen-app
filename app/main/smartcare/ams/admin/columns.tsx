import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { Contract } from "@/types/contracts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";

interface AMSProjectTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function AMSProjectTableRowActions<TData extends Contract>({ row }: AMSProjectTableRowActionsProps<TData>) {
  const router = useRouter();
  const handleOpenDetails = () => {
    const contractId = row.original.id;
    if (contractId) {
      sessionStorage.setItem(`project-${contractId}`, JSON.stringify(row.original));
      router.push(`/main/smartcare/ams/${contractId}`);
    }
  };
  const handleCloseProject = async () => {
    const contractId = row.original.id;
    if (!contractId) return;
    try {
      const res = await fetch("/api/smartcare/ams-projects/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contractId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao encerrar projeto");
      }
      toast.success("Projeto encerrado com sucesso!");
      router.refresh();
    } catch (e: unknown) {
      if (e instanceof Error) {
        toast.error(e.message || "Erro ao encerrar projeto");
      } else {
        toast.error("Erro ao encerrar projeto");
      }
    }
  };
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
        <DropdownMenuItem onClick={handleOpenDetails}>Detalhes</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCloseProject}>
          Encerrar Projeto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: "projectExtId",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Project.Id" />,
    cell: ({ row }) => row.original.projectExtId || "-",
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => <span>{row.original.projectName || "-"}</span>,
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
      : row.original.partnerId || "-",
  },
  {
    accessorKey: "project_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => row.original.project_type || "-",
  },
  {
    accessorKey: "project_status.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => row.original.project_status?.name || "-",
  },
  {
    accessorKey: "is_wildcard",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Wildcard?" />,
    cell: ({ row }) => (row.original.is_wildcard ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>),
  },
  {
    accessorKey: "is_247",
    header: ({ column }) => <DataTableColumnHeader column={column} title="24/7?" />,
    cell: ({ row }) => (row.original.is_247 ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>),
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
