"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { PartnerTableRowActions } from "@/components/partner-table-row-actions";
import type { Partner } from "@/types/partners";
import { formatCpfCnpj, formatPhoneNumber } from "@/lib/utils";
import { ColoredBadge } from "@/components/ui/colored-badge";

export const columns: ColumnDef<Partner>[] = [
	{
		accessorKey: "partner_ext_id",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Id.Parceiro" />
		),
	},
	{
		accessorKey: "partner_desc",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
	},
	{
		accessorKey: "partner_ident",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Identificação" />
		),
		cell: ({ row }) => {
		const value = row.getValue("partner_ident") as string;
		return formatCpfCnpj(value);
	},
	},
	{
		accessorKey: "partner_email",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
	},
	{
		accessorKey: "partner_tel",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Telefone" />
		),
		cell: ({ row }) => {
			const value = row.getValue("partner_tel") as string;
			return formatPhoneNumber(value);
		},
	},
	{
		accessorKey: "partner_segment.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Segmento" />
		),
	},
	{
		accessorKey: "is_compadm",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipo Parceiro" />
		),
		cell: ({ row }) => {
			const value = row.getValue("is_compadm") as string | boolean | { name: string; color: string } | null | undefined;
			return <ColoredBadge value={value} type="is_client" />;
		},
	},
	{
		accessorKey: "is_active",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const active = row.getValue("is_active") as string | boolean | { name: string; color: string } | null | undefined;
			return <ColoredBadge value={active} type="status" />;
		},
	},
	{
		accessorKey: "id",
		header: () => null,
		cell: () => null,
		enableHiding: false,
		enableSorting: false,
		meta: { hidden: true },
	},
	{
		id: "actions",
		cell: ({ row }) => <PartnerTableRowActions row={row} />,
	},
	
];
