import { ColumnDef } from "@tanstack/react-table";
import type { User as BaseUser } from "@/types/users";
import { UnlinkProjectUserButton as UnlinkProjectUserButtonProject } from "@/components/UnlinkProjectUserButton";
import { Button } from "@/components/ui/button";
import React from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { EditProjectUserHoursButton } from "@/components/EditProjectUserHoursButton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ColoredBadge } from "@/components/ui/colored-badge";
import { getModuleOptions } from "@/hooks/useOptions";

type User = BaseUser & {
  horas_consumidas?: number;
  is_suspended?: boolean;
  user_functional?: string;
  project_resource_id?: number;
  hora_faturavel?: number;
};

// Cache global para os módulos - agora com Map para acesso O(1)
const modulesMap = new Map<string, string>();
let modulesLoaded = false;

// Inicializa o cache de módulos
const initializeModulesCache = async () => {
  if (modulesLoaded) return;
  
  try {
    const modules = await getModuleOptions();
    modules.forEach(module => {
      modulesMap.set(String(module.id), module.name);
    });
    modulesLoaded = true;
  } catch (error) {
    console.error('Error loading modules:', error);
  }
};

// Componente simplificado que usa o cache
const ModuleDisplay: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  if (!moduleId) {
    return <span className="text-muted-foreground">-</span>;
  }

  const moduleName = modulesMap.get(String(moduleId));
  
  if (!moduleName) {
    return <span className="text-muted-foreground">-</span>;
  }

  return <span>{moduleName}</span>;
};

export const columns = (projectId: string, isClosed?: boolean): ColumnDef<User>[] => {
  // Inicializa o cache de módulos na primeira chamada
  initializeModulesCache();
  
  return [
  {
    accessorKey: "first_name",
    header: "Nome",
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`.trim(),
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },  {
    accessorKey: "tel_contact",
    header: "Telefone",
    cell: ({ row }) => row.original.tel_contact ?? "-",
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
  {
    accessorKey: "hours_max",
    header: "Horas Alocadas",
    cell: ({ row }) => row.original.hours_max ?? "-",
  },
  {
    accessorKey: "hora_faturavel", 
    header: "Hora Faturável (%)",
    cell: ({ row }) => {
      const horaFaturavel = row.original.hora_faturavel;
      return horaFaturavel !== null && horaFaturavel !== undefined 
        ? `${horaFaturavel}%` 
        : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: "horas_consumidas",
    header: "Horas Consumidas",
    cell: ({ row }) => row.original.horas_consumidas ?? <span className="text-muted-foreground">...</span>,
  },
  {
    id: "is_suspended",
    header: "Status",
    cell: ({ row }) => <ColoredBadge value={row.original.is_suspended} type="suspended" />,
  },  {
    accessorKey: "user_functional",
    header: "Alocação",
    cell: ({ row }) => <ModuleDisplay moduleId={row.original.user_functional} />,
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
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    window.open(`/smartcare/ams/${projectId}/tickets/messages?userId=${user.id}`, "_blank");
                  }}
                >
                  <span className="sr-only">Ver mensagens do usuário</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver mensagens do usuário (abre em nova aba)</TooltipContent>
            </Tooltip> */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleToggleSuspended}
                  disabled={isClosed}
                >
                  {user.is_suspended ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{user.is_suspended ? "Reativar usuário no projeto" : "Suspender usuário no projeto"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <EditProjectUserHoursButton
                    userId={user.id}
                    projectId={projectId}
                    projectResourceId={user.project_resource_id ?? 0}
                    currentHours={user.hours_max ?? 0}
                    onUpdated={() => window.location.reload()}
                    disabled={isClosed}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Editar horas alocadas do usuário</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <UnlinkProjectUserButtonProject
                    userId={user.id}
                    projectId={projectId}
                    projectResourceId={user.project_resource_id ?? 0}
                    consumedHours={user.horas_consumidas ?? 0}
                    onUnlinked={() => window.location.reload()}
                    disabled={isClosed}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Desvincular usuário do projeto</TooltipContent>
            </Tooltip>
          </div>        
          </TooltipProvider>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
};
