import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { Ticket } from "@/types/tickets";
import { SmartbuildTableRowActions } from "@/components/smartbuild-management-able-row-actions";

export const columns: ColumnDef<Ticket>[] = [
	{
		accessorKey: "external_id",
		header: "ID",
		cell: ({ row }) => String(row.original.external_id).padStart(5, "0"),
	},
	{
		accessorKey: "title",
		header: "Título",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => row.original.status?.name || row.original.status_id || "-",
	},
	{
		accessorKey: "priority",
		header: "Prioridade",
		cell: ({ row }) => row.original.priority?.name || row.original.priority_id || "-",
	},
	{
		accessorKey: "type",
		header: "Tipo",
		cell: ({ row }) => row.original.type?.name || row.original.type_id || "-",
	},
	{
		accessorKey: "created_at",
		header: "Criado em",
		cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString("pt-BR") : "-",
	},
	{
		accessorKey: "is_closed",
		header: "Fechado?",
		cell: ({ row }) => row.original.is_closed ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>,
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			return <SmartbuildTableRowActions row={row} />;
		},
		enableSorting: false,
		enableHiding: false,
	},
];
