import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types/users";
import { ColoredBadge } from "@/components/ui/colored-badge";

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
      let cargo = "Indefinido";
      if (role === 1) cargo = "Administrador";
      else if (role === 2) cargo = "Gerente";
      else if (role === 3 && isClient === true) cargo = "Key-User";
      else if (role === 3 && isClient === false) cargo = "Funcional";
      return <ColoredBadge value={cargo} type="user_role" />;
    },
  },
  {
    accessorKey: "is_active",
    header: "Ativo?",
    cell: ({ row }) => <ColoredBadge value={row.original.is_active} type="status" />,
  },
];
