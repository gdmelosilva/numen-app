"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SquareTerminal, WrenchIcon, ShieldUser, Blocks, ClockFading, HandCoins } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

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

// Componente AppSidebar
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, setExpanded } = useSidebar();
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const [currentPath, setCurrentPath] = React.useState(pathname);

  const navMain = React.useMemo(() => [
    {
      title: "Utilitários",
      url: "/main/utils",
      icon: WrenchIcon,
      isActive: true,
      newTab: false,
      items: [
        { title: "Cargos", url: "/main/utils/roles", newTab: false }
      ],
      roles: ["ADMIN"],
    },
    { type: "separator" },
    {
      title: "Administrativo",
      url: "/main/admin",
      icon: SquareTerminal,
      isActive: true,
      newTab: false,
      items: [
        { title: "Usuários", url: "/main/admin/users", newTab: false },
        { title: "Parceiros", url: "/main/admin/partners", newTab: false },
        { title: "Contratos de Serviço", url: "/main/admin/projects", newTab: false },
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
        { title: "Administrar Chamados", url: "/main/tickets/management", newTab: false },
        { title: "Abrir Chamado", url: "/main/tickets/create", newTab: false },
      ],
    },
    {
      title: "SmartBuild - Projetos",
      url: "####",
      icon: Blocks,
      isActive: true,
      newTab: false,
      items: [
        { title: "Gestão de Atividades", url: "/main/projects/management", newTab: false },
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

  // Preserva o estado dos itens abertos
  React.useEffect(() => {
    const parentUrl = navMain.find(item => 
      item.items?.some(subItem => subItem.url === pathname)
    )?.url;

    if (parentUrl && !openItems.includes(parentUrl)) {
      setOpenItems(prev => [...prev, parentUrl]);
    }
  }, [pathname, navMain, openItems]);

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-border/40 bg-background transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
        <button
          onClick={() => handleNavigation("/", false)}
          className="flex items-center gap-2 font-semibold"
        >
            {/* <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center p-1"> */}
            {/* </div> */}
            {expanded &&  
            <>
            <span className="text-primary-foreground font-bold text-sm ">
              <Image src="/logo_p.svg" alt="Logo" width={35} height={35} />
            </span><span>Numen Ops</span></>}
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
        {navMain.map((item, idx) => {
          if (item.type === "separator") {
            return (
              <div key={`separator-${idx}`} className="my-2 border-y border-border" />
            );
          }
          // Type guard: item is not a separator
          const typedItem = item as Exclude<typeof item, { type: string }>;
          return (
            <div key={typedItem.url}>
              <button
                onClick={() => typedItem.url && toggleItem(typedItem.url)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  currentPath === typedItem.url
                    ? "bg-red-500 text-accent-foreground"
                    : "hover:bg-primary hover:text-accent-foreground"
                )}
              >
                {typedItem.icon && <typedItem.icon className="h-4 w-4" />}
                {expanded && <span>{typedItem.title}</span>}
              </button>
              {expanded && typedItem.url && openItems.includes(typedItem.url) && typedItem.items && (
                <div className="ml-6 mt-1 space-y-1">
                  {typedItem.items.map((subItem) => (
                    <button
                      key={subItem.url}
                      onClick={() => handleNavigation(subItem.url, subItem.newTab)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-colors",
                        currentPath === subItem.url
                          ? "bg-red-500 text-accent-foreground"
                          : "hover:bg-primary hover:text-accent-foreground"
                      )}
                    >
                      {subItem.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}