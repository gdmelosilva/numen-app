import { ColumnDef } from "@tanstack/react-table";

export type AMSProject = {
  id: string;
  projectName: string;
  projectDesc?: string;
  partnerId?: string;
};

export const amsColumns: ColumnDef<AMSProject>[] = [
  {
    accessorKey: "projectName",
    header: "Nome",
    cell: ({ row }) => row.getValue("projectName") || "-",
  },
  {
    accessorKey: "projectDesc",
    header: "Descrição",
    cell: ({ row }) => row.getValue("projectDesc") || "-",
  },
  {
    accessorKey: "partnerId",
    header: "Parceiro",
    cell: ({ row }) => row.getValue("partnerId") || "-",
  },
];
