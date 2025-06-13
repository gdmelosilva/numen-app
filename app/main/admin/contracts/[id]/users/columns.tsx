import { ColumnDef } from "@tanstack/react-table";
import type { User as BaseUser } from "@/types/users";
import { Badge } from "@/components/ui/badge";
import { UnlinkProjectUserButton as UnlinkProjectUserButtonProject } from "@/components/UnlinkProjectUserButton";
import { Button } from "@/components/ui/button";
import React from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { EditProjectUserHoursButton } from "@/components/EditProjectUserHoursButton";

type User = BaseUser & {
  horas_consumidas?: number;
  is_suspended?: boolean;
  user_functional?: string;
  project_resource_id?: number;
};

export const columns = (projectId: string, isClosed?: boolean): ColumnDef<User>[] => [
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
    id: "is_suspended",
    header: "Status",
    cell: ({ row }) => row.original.is_suspended ? <Badge variant="accent">Suspenso</Badge> : <Badge variant="approved">Mobilizado</Badge>,
  },
  {
    accessorKey: "user_functional",
    header: "Alocação",
    cell: ({ row }) => row.original.user_functional || <span className="text-muted-foreground">-</span>,
  },
  {
    id: "actions",
    header: "Ações",
    cell: function ActionsCell({ row }) {
      const user = row.original;
      const handleToggleSuspended = async () => {
        if (!user.project_resource_id) return;
        const res = await fetch("/api/project-resources/suspend", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.project_resource_id, is_suspended: !user.is_suspended }),
        });
        if (res.ok) {
          window.location.reload();
        }
      };
      return (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={user.is_suspended ? "colored2" : "colored1"}
            className="text-white"
            title={user.is_suspended ? "Reativar recurso" : "Suspender recurso"}
            onClick={handleToggleSuspended}
            disabled={isClosed}
          >
            {user.is_suspended ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </Button>
          <EditProjectUserHoursButton
            userId={user.id}
            projectId={projectId}
            projectResourceId={user.project_resource_id ?? 0}
            currentHours={user.hours_max ?? 0}
            onUpdated={() => window.location.reload()}
            disabled={isClosed}
          />
          <UnlinkProjectUserButtonProject
            userId={user.id}
            projectId={projectId}
            projectResourceId={user.project_resource_id ?? 0}
            consumedHours={user.horas_consumidas || 0}
            onUnlinked={() => window.location.reload()}
            disabled={isClosed}
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
