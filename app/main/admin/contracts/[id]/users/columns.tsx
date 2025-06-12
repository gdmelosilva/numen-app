import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types/users";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "first_name",
    header: "Nome",
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`.trim(),
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "tel_contact",
    header: "Telefone",
    cell: ({ row }) => row.original.tel_contact || "-",
  },
  {
    accessorKey: "role",
    header: "Cargo",
    cell: ({ row }) => {
      const role = row.original.role;
      const isClient = row.original.is_client;
      if (role === 1) return "Administrador";
      if (role === 2) return "Gerente";
      if (role === 3 && isClient === true) return "Key-User";
      if (role === 3 && isClient === false) return "Funcional";
      return "Indefinido";
    },
  },
  {
    accessorKey: "is_active",
    header: "Ativo?",
    cell: ({ row }) => row.original.is_active ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>,
  },
];
