import type { AuthenticatedUser } from "@/lib/api-auth";

export type NavItem = {
  title?: string;
  url?: string;
  icon?: React.ElementType;
  isActive?: boolean;
  newTab?: boolean;
  items?: { title: string; url: string; newTab: boolean }[];
  roles?: string[];
  type?: string;
};

export type MenuVisibilityRule = {
  match: (user: AuthenticatedUser) => boolean;
  hide: (string | { parent: string; items: string[] })[];
};

export const menuVisibilityRules: MenuVisibilityRule[] = [
  {
    match: (user) => user.role === 1 && user.is_client === true, // Admin cliente
    hide: [
      "Utilitários",
      "TimeSheet",
      "TimeFlow - Faturamento",
      { parent: "Administrativo", items: ["Parceiros", "Contratos de Serviço"] },
    ],
  },
  {
    match: (user) => user.role === 2 && user.is_client === true, // Gerente cliente
    hide: [
      "Utilitários",
      "TimeFlow - Faturamento",
      "Administrativo",
      "TimeSheet", // Bloqueia toda a aba TimeSheet para gerentes clientes
    ],
  },
  {
    match: (user) => user.role === 3 && user.is_client === true, // Key-User Cliente
    hide: [
      "Utilitários",
      "TimeFlow - Faturamento",
      "Administrativo",
      "TimeSheet",
      "TimeFlow - Faturamento",
      { parent: "SmartCare - AMS", items: ["Gestão AMS"] },
      { parent: "SmartBuild - Projetos", items: ["Gestão de Projetos"] },
    ],
  },
  {
    match: (user) => user.role === 2 && user.is_client === false, // Gerente Administrativo
    hide: [
      "Utilitários",
      "Administrativo",
    ],
  },
  {
    match: (user) => user.role === 3 && user.is_client === false, // Funcional Administrativo
    hide: [
      "Utilitários",
      "TimeFlow - Faturamento",
      "Administrativo",
      { parent: "SmartCare - AMS", items: ["Gestão AMS"] },
      { parent: "SmartBuild - Projetos", items: ["Gestão de Projetos"] },
    ],
  },
];

// Lista de rotas principais e subrotas para bloqueio
export const navMainRoutes = [
  {
    title: "Administrativo",
    url: "/main/admin",
    items: [
      { title: "Usuários", url: "/main/admin/users" },
      { title: "Parceiros", url: "/main/admin/partners" },
      { title: "Contratos de Serviço", url: "/main/admin/contracts" },
    ],
  },
  {
    title: "SmartCare - AMS",
    url: "#",
    items: [
      { title: "Gestão AMS", url: "/main/smartcare/ams" },
      { title: "Administrar Chamados", url: "/main/smartcare/management" },
      { title: "Abrir Chamado", url: "/main/smartcare/create" },
    ],
  },
  {
    title: "SmartBuild - Projetos",
    url: "####",
    items: [
      { title: "Gestão de Projetos", url: "/main/smartbuild" },
      { title: "Administrar Atividades", url: "/main/smartbuild/management" },
    ],
  },
  {
    title: "TimeSheet",
    url: "##",
    items: [
      { title: "Gestão de Horas", url: "/main/timesheet/management" },
      { title: "Apontamento de Horas", url: "/main/timesheet/create" },
    ],
  },
  {
    title: "TimeFlow - Faturamento",
    url: "###",
    items: [
      { title: "Relatório de Fechamentos", url: "/main/timeflow/management" },
      { title: "Fechamento de Período", url: "/main/timeflow/create" },
    ],
  },
  {
    title: "Utilitários",
    url: "/main/utils",
    items: [],
  },
];

// Função para verificar se a rota está bloqueada para o usuário
export function isRouteBlocked(path: string, user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  for (const rule of menuVisibilityRules) {
    if (rule.match(user)) {
      for (const hide of rule.hide) {
        if (typeof hide === "string") {
          // Bloqueia todas as rotas da aba
          const nav = navMainRoutes.find((item) => item.title === hide);
          if (nav) {
            // Só bloqueia a rota principal da aba e não todos os filhos
            if (nav.url && path === nav.url.replace(/#+$/, "")) return true;
          }
        } else if (hide.parent && Array.isArray(hide.items)) {
          const nav = navMainRoutes.find((item) => item.title === hide.parent);
          if (nav && nav.items) {
            for (const sub of nav.items) {
              if (hide.items.includes(sub.title) && sub.url && path === sub.url) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
}
