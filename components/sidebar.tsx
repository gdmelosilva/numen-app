"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SquareTerminal, WrenchIcon, ShieldUser, Blocks, ClockFading, HandCoins } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useUserContext } from "@/components/user-context";

// Contexto da Sidebar
interface SidebarContextValue {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Componente SidebarInset
export function SidebarInset({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// --- Regras de visibilidade de menus ---
import type { AuthenticatedUser } from "@/lib/api-auth";

type NavItem = {
  title?: string;
  url?: string;
  icon?: React.ElementType;
  isActive?: boolean;
  newTab?: boolean;
  items?: { title: string; url: string; newTab: boolean }[];
  roles?: string[];
  type?: string;
};

type MenuVisibilityRule = {
  match: (user: AuthenticatedUser) => boolean;
  hide: (string | { parent: string; items: string[] })[];
};

const menuVisibilityRules: MenuVisibilityRule[] = [
  {
    match: (user) => user.role === 1 && user.is_client === true, // Admin cliente
    hide: [
      // Esconder abas inteiras
      "Utilitários",
      "TimeSheet",
      "TimeFlow - Faturamento",
      // Esconder itens específicos da aba Administrativo
      { parent: "Administrativo", items: ["Parceiros", "Contratos de Serviço"] },
    ],
  },
  {
    match: (user) => user.role === 2 && user.is_client === true, // Gerente cliente
    hide: [
      // Esconder abas inteiras
      "Utilitários",
      "TimeSheet",
      "TimeFlow - Faturamento",
      "Administrativo",
    ],
  },
  // Adicione mais regras conforme necessário
];

function filterNavMain(navMain: NavItem[], user: AuthenticatedUser | null): NavItem[] {
  if (!user) return navMain;
  let filtered = navMain;
  for (const rule of menuVisibilityRules) {
    if (rule.match(user)) {
      for (const hide of rule.hide) {
        if (typeof hide === "string") {
          filtered = filtered.filter((item: NavItem) => item.title !== hide);
        } else if (hide.parent && Array.isArray(hide.items)) {
          filtered = filtered.map((item: NavItem) => {
            if (item.title === hide.parent && Array.isArray(item.items)) {
              return {
                ...item,
                items: item.items.filter((sub: { title: string }) => !hide.items.includes(sub.title)),
              };
            }
            return item;
          });
        }
      }
    }
  }
  return filtered;
}

// Componente AppSidebar
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, setExpanded } = useSidebar();
  const { user, loading } = useUserContext();

  const navMain = React.useMemo(() => [

    {
      title: "Administrativo",
      url: "/main/admin",
      icon: SquareTerminal,
      isActive: true,
      newTab: false,
      items: [
        { title: "Usuários", url: "/main/admin/users", newTab: false },
        { title: "Parceiros", url: "/main/admin/partners", newTab: false },
        { title: "Contratos de Serviço", url: "/main/admin/contracts", newTab: false },
      ],
      roles: ["ADMIN"],
    },
    { type: "separator" },
    {
      title: "SmartCare - AMS",
      url: "#",
      icon: ShieldUser,
      isActive: true,
      newTab: false,
      items: [
        { title: "Administrar Chamados", url: "/main/smartcare/management", newTab: false },
        { title: "Abrir Chamado", url: "/main/smartcare/create", newTab: false },
      ],
    },
    {
      title: "SmartBuild - Projetos",
      url: "####",
      icon: Blocks,
      isActive: true,
      newTab: false,
      items: [
        { title: "Gestão de Projetos", url: "/main/smartbuild", newTab: false },
      ],
    },
    { type: "separator" },
    {
      title: "TimeSheet",
      url: "##",
      icon: ClockFading,
      isActive: true,
      newTab: false,
      items: [
        { title: "Gestão de Horas", url: "/main/projects/management", newTab: false },
        { title: "Apontamento de Horas", url: "/main/projects/create", newTab: false },
      ],
    },
    { type: "separator" },
    {
      title: "TimeFlow - Faturamento",
      url: "###",
      icon: HandCoins,
      isActive: true,
      newTab: false,
    },
    { type: "separator" },
    {
      title: "Utilitários",
      url: "/main/utils",
      icon: WrenchIcon,
      isActive: true,
      newTab: false,
      items: [
        { title: "Cargos", url: "/main/utils/roles", newTab: false },
        { title: "Teste", url: "/main/utils/test", newTab: false }
      ],
      roles: ["ADMIN"],
    }
  ], []);

  const toggleItem = React.useCallback((url: string) => {
    setOpenItems(prev => 
      prev.includes(url) 
        ? prev.filter(item => item !== url)
        : [...prev, url]
    );
  }, []);

  const handleNavigation = React.useCallback((url: string, newTab: boolean) => {
    if (newTab) {
      window.open(url, '_blank');
    } else {
      setCurrentPath(url);
      router.push(url, { scroll: false });
    }
  }, [router]);

  // Aplica regras de visibilidade
  const filteredNavMain = React.useMemo(() => filterNavMain(navMain, user), [navMain, user]);

  // Separa o item Utilitários do restante do menu
  const utilitariosItem = React.useMemo(() =>
    filteredNavMain.find(item => item.title === "Utilitários"),
    [filteredNavMain]
  );
  const filteredNavMainWithoutUtilitarios = React.useMemo(() =>
    filteredNavMain.filter(item => item.title !== "Utilitários"),
    [filteredNavMain]
  );

  // Sempre deixa todas as abas abertas por padrão
  const allParentUrls = React.useMemo(() =>
    filteredNavMain.filter(item => item.url && item.items && item.items.length > 0).map(item => item.url!),
    [filteredNavMain]
  );

  const [openItems, setOpenItems] = React.useState<string[]>(allParentUrls);
  const [currentPath, setCurrentPath] = React.useState(pathname);

  // Atualiza abas abertas quando muda o menu (ex: após login ou mudança de regras)
  React.useEffect(() => {
    setOpenItems(allParentUrls);
  }, [allParentUrls]);

  // Exibe loading enquanto usuário está carregando
  if (loading) {
    return (
      <div className={cn(
        "flex h-screen flex-col border-r border-border/40 bg-background transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-muted-foreground animate-pulse">Carregando menu...</span>
        </div>
      </div>
    );
  }

  // Componente SidebarUserCard
  function SidebarUserCard() {
    const { user, loading } = useUserContext();
    if (loading) {
      return (
        <div className="flex items-center gap-3 p-3 border-t border-border/40 bg-background/80 animate-pulse">
          <div className="h-10 w-10 rounded-md bg-muted" />
          <div className="flex flex-col gap-1">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
      );
    }
    if (!user) return null;
    const name = `${user.first_name} ${user.last_name}`.trim();
    return (
      <div className="flex items-center gap-3 p-3 border-t border-border/40 bg-background/80">
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted text-primary font-bold text-lg">
          {/* Avatar genérico: Iniciais do nome */}
          {user.first_name && user.last_name
            ? `${user.first_name[0]}${user.last_name[0]}`
            : user.first_name?.[0] || user.last_name?.[0] || "?"}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm text-default-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{typeof user.role === 'string' ? user.role : roleToLabel(user.role, user.is_client)}</span>
        </div>
      </div>
    );
  }

  // Função utilitária para exibir o nome do cargo
  function roleToLabel(role: number | string | null | undefined, is_client: boolean) {
    if ((role === 1 || role === "1")) return "Administrador";
    if (role === 2 || role === "2") return "Gerente";
    if ((role === 3 || role === "3") && (is_client === true )) return "Key-User";
    if ((role === 3 || role === "3") && (is_client === false )) return "Funcional";
    return "Cargo Indefinido";
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-border/40 bg-background transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
      style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
        <button
          onClick={() => handleNavigation("/", false)}
          className={cn(
            "flex items-center justify-center w-full h-10 transition-all duration-300 overflow-hidden",
            expanded ? "px-0" : "px-0"
          )}
          style={{
            position: "relative",
            minHeight: "40px",
          }}
        >
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              expanded ? "w-[140px]" : "w-[40px]"
            )}
            style={{
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
              height: "35px",
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <Image
              src="/logo_hor.svg"
              alt="Logo"
              width={140}
              height={35}
              style={{
          transition: "margin-left 0.3s, opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
          marginLeft: expanded ? 0 : -50,
          opacity: expanded ? 1 : 0,
          objectFit: "contain",
              }}
              priority
            />
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavMainWithoutUtilitarios.map((item: NavItem, idx: number) => {
          if (item.type === "separator") {
            return (
              <div key={`separator-${idx}`} className="my-2 border-y border-border transition-all duration-300" style={{ opacity: expanded ? 1 : 0.5, transition: 'opacity 0.3s' }} />
            );
          }
          // Type guard: item is not a separator
          const typedItem = item as Exclude<typeof item, { type: string }>;
          return (
            <div key={typedItem.url} className="overflow-hidden">
              <button
                onClick={() => typedItem.url && toggleItem(typedItem.url)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  currentPath === typedItem.url
                    ? "bg-red-500 text-accent-foreground"
                    : "hover:bg-primary hover:text-accent-foreground"
                )}
                style={{
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                {typedItem.icon && <typedItem.icon className="h-4 w-4 transition-all duration-300" style={{ opacity: expanded ? 1 : 0.7, transition: 'opacity 0.3s' }} />}
                <span
                  className="transition-all duration-300"
                  style={{
                    opacity: expanded ? 1 : 0,
                    maxWidth: expanded ? 200 : 0,
                    marginLeft: expanded ? 0 : -16,
                    transition: 'opacity 0.3s, max-width 0.3s, margin-left 0.3s',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {typedItem.title}
                </span>
              </button>
              {typedItem.url && (
                <div
                  className="transition-all duration-300"
                  style={{
                    maxHeight: expanded && openItems.includes(typedItem.url) && typedItem.items ? typedItem.items.length * 40 + 8 : 0,
                    opacity: expanded && openItems.includes(typedItem.url) && typedItem.items ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                  }}
                >
                  {expanded && openItems.includes(typedItem.url) && typedItem.items && (
                    <div className="ml-6 mt-1 space-y-1">
                      {typedItem.items.map((subItem: { title: string; url: string; newTab: boolean }) => (
                        <button
                          key={subItem.url}
                          onClick={() => handleNavigation(subItem.url, subItem.newTab)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-colors",
                            currentPath === subItem.url
                              ? "bg-red-500 text-accent-foreground"
                              : "hover:bg-primary hover:text-accent-foreground"
                          )}
                          style={{
                            transition: 'background 0.3s, color 0.3s',
                            opacity: expanded ? 1 : 0,
                            transform: expanded ? 'translateX(0)' : 'translateX(-10px)',
                            transitionProperty: 'opacity, transform',
                            transitionDuration: '0.3s',
                          }}
                        >
                          {subItem.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Utilitários fixo na base da sidebar, acima do card do usuário */}
      {utilitariosItem && (
        <div className="p-2 border-t border-border/40" style={{ marginTop: 'auto' }}>
          <div className="overflow-hidden">
            <button
              onClick={() => utilitariosItem.url && toggleItem(utilitariosItem.url)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPath === utilitariosItem.url
                  ? "bg-red-500 text-accent-foreground"
                  : "hover:bg-primary hover:text-accent-foreground"
              )}
              style={{
                transition: 'background 0.3s, color 0.3s',
              }}
            >
              {utilitariosItem.icon && <utilitariosItem.icon className="h-4 w-4 transition-all duration-300" style={{ opacity: expanded ? 1 : 0.7, transition: 'opacity 0.3s' }} />}
              <span
                className="transition-all duration-300"
                style={{
                  opacity: expanded ? 1 : 0,
                  maxWidth: expanded ? 200 : 0,
                  marginLeft: expanded ? 0 : -16,
                  transition: 'opacity 0.3s, max-width 0.3s, margin-left 0.3s',
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {utilitariosItem.title}
              </span>
            </button>
            {utilitariosItem.url && (
              <div
                className="transition-all duration-300"
                style={{
                  maxHeight: expanded && openItems.includes(utilitariosItem.url) && utilitariosItem.items ? utilitariosItem.items.length * 40 + 8 : 0,
                  opacity: expanded && openItems.includes(utilitariosItem.url) && utilitariosItem.items ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
                }}
              >
                {expanded && openItems.includes(utilitariosItem.url) && utilitariosItem.items && (
                  <div className="ml-6 mt-1 space-y-1">
                    {utilitariosItem.items.map((subItem: { title: string; url: string; newTab: boolean }) => (
                      <button
                        key={subItem.url}
                        onClick={() => handleNavigation(subItem.url, subItem.newTab)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-colors",
                          currentPath === subItem.url
                            ? "bg-red-500 text-accent-foreground"
                            : "hover:bg-primary hover:text-accent-foreground"
                        )}
                        style={{
                          transition: 'background 0.3s, color 0.3s',
                          opacity: expanded ? 1 : 0,
                          transform: expanded ? 'translateX(0)' : 'translateX(-10px)',
                          transitionProperty: 'opacity, transform',
                          transitionDuration: '0.3s',
                        }}
                      >
                        {subItem.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Card do usuário na parte inferior */}
      {expanded && <SidebarUserCard />}
    </div>
  );
}