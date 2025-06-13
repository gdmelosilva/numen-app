import { ColumnDef } from "@tanstack/react-table";
import type { User as BaseUser } from "@/types/users";
import { Badge } from "@/components/ui/badge";
import { UnlinkUserButton } from "@/components/UnlinkUserButton";
import { Button } from "@/components/ui/button";
import React from "react";
import { PauseCircle, PlayCircle } from "lucide-react";

type User = BaseUser & {
  horas_consumidas?: number;
};

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
  {
    accessorKey: "hours_max",
    header: "Horas Alocadas",
    cell: ({ row }) => row.original.hours_max ?? "-",
  },
  {
    id: "horas_consumidas",
    header: "Horas Consumidas",
    cell: ({ row }) => row.original.horas_consumidas ?? <span className="text-muted-foreground">...</span>,
  },
  {
    id: "actions",
    header: "Ações",
    cell: function ActionsCell({ row }) {
      const user = row.original;
      const handleToggleActive = async () => {
        const res = await fetch("/api/admin/users/" + user.email, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !user.is_active }),
        });
        if (res.ok) {
          window.location.reload();
        }
      };
      return (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={user.is_active ? "outline" : "secondary"}
            title={user.is_active ? "Suspender" : "Ativar"}
            onClick={handleToggleActive}
          >
            {user.is_active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          </Button>
          <UnlinkUserButton user={user} partnerId={user.partner_id?.toString() || ''} onUnlinked={() => window.location.reload()} />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
