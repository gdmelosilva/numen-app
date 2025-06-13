import { ColoredBadge } from "@/components/ui/colored-badge";
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
		cell: ({ row }) => <ColoredBadge value={row.original.status?.name || String(row.original.status_id)} type="status" />,
	},
	{
		accessorKey: "priority",
		header: "Prioridade",
		cell: ({ row }) => <ColoredBadge value={row.original.priority?.name || String(row.original.priority_id)} type="priority" />,
	},
	{
		accessorKey: "type",
		header: "Tipo",
		cell: ({ row }) => <ColoredBadge value={row.original.type?.name || String(row.original.type_id)} type="ticket_type" />,
	},
	{
		accessorKey: "created_at",
		header: "Criado em",
		cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString("pt-BR") : "-",
	},
	{
		accessorKey: "is_closed",
		header: "Fechado?",
		cell: ({ row }) => <ColoredBadge value={row.original.is_closed} type="boolean" />,
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
