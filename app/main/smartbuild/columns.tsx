import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { SmartbuildTableRowActions } from "@/components/smartbuild-table-row-actions";
import { ColoredBadge } from "@/components/ui/colored-badge";
import type { Contract } from "@/types/contracts";

export const columns: ColumnDef<Contract>[] = [
	// {
	// 	accessorKey: "id",
	// 	header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
	// },
	{
		accessorKey: "projectExtId",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Id.Contrato" />,
	},
	{
		accessorKey: "projectName",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
		cell: ({ row }) => (
			<span>
				{row.original.projectName || "-"}
			</span>
		),
	},
	{
		accessorKey: "projectDesc",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
	},
	{
		accessorKey: "partner.partner_desc",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Parceiro" />,
		cell: ({ row }) => row.original.partner?.partner_desc || row.original.partner?.partner_ext_id || row.original.partner?.id || "-",
	},
	{
		accessorKey: "partner.partner_city",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade" />,
		cell: ({ row }) => row.original.partner?.partner_city || "-",
	},
	{
		accessorKey: "partner.partner_email",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
		cell: ({ row }) => row.original.partner?.partner_email || "-",
	},
	{
		accessorKey: "partner.partner_tel",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Telefone" />,
		cell: ({ row }) => row.original.partner?.partner_tel || "-",
	},
	{
		accessorKey: "partner.partner_cep",
		header: ({ column }) => <DataTableColumnHeader column={column} title="CEP" />,
		cell: ({ row }) => row.original.partner?.partner_cep || "-",
	},
	{
		accessorKey: "partner.partner_state",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
		cell: ({ row }) => row.original.partner?.partner_state || "-",
	},
	{
		accessorKey: "partner.partner_ext_id",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Cód. Externo" />,
		cell: ({ row }) => row.original.partner?.partner_ext_id || "-",
	},
	{
		accessorKey: "project_type",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
		cell: ({ row }) => <ColoredBadge value={row.original.project_type} type="project_type" />,
	},
	{
		accessorKey: "project_status.name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => <ColoredBadge value={row.original.project_status} type="project_status" />,
	},
	{
		accessorKey: "is_wildcard",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Wildcard?" />,
		cell: ({ row }) => <ColoredBadge value={row.original.is_wildcard} type="boolean" />,
	},
	{
		accessorKey: "is_247",
		header: ({ column }) => <DataTableColumnHeader column={column} title="24/7?" />,
		cell: ({ row }) => <ColoredBadge value={row.original.is_247} type="boolean" />,
	},
	{
		accessorKey: "start_date",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Início" />,
		cell: ({ row }) => (row.original.start_date ? format(new Date(row.original.start_date), "dd/MM/yyyy", { locale: ptBR }) : "-"),
	},
	{
		accessorKey: "end_at",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Fim" />,
		cell: ({ row }) => (row.original.end_at ? format(new Date(row.original.end_at), "dd/MM/yyyy", { locale: ptBR }) : "-"),
	},
	{
		id: "actions",
		cell: ({ row }) => <SmartbuildTableRowActions row={row} />,
	},
];
