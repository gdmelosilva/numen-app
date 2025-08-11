"use client"

import * as React from "react";
import { BreadcrumbDynamic } from "@/components/BreadcrumbDynamic";
import ThemeSwitcher from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { NotificationPopover } from "@/components/NotificationPopover";
import { useUserContext } from "@/components/user-context";

export function TopBar() {
  const { user, loading } = useUserContext();

  // Função utilitária para exibir o nome do cargo
  function roleToLabel(role: number | string | null | undefined, is_client: boolean) {
    if ((role === 1 || role === "1")) return "Administrador";
    if (role === 2 || role === "2") return "Gerente";
    if ((role === 3 || role === "3") && (is_client === true)) return "Key-User";
    if ((role === 3 || role === "3") && (is_client === false)) return "Funcional";
    return "Cargo Indefinido";
  }

  // Gera as iniciais do usuário
  function getUserInitials() {
    if (!user) return "UN";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.last_name) return user.last_name[0].toUpperCase();
    return "UN";
  }

  // Gera o nome completo do usuário
  function getUserFullName() {
    if (!user) return "Usuário";
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return name || "Usuário";
  }

  return (
    <header className="flex h-14 items-center border-b bg-primary px-4 text-primary-foreground">
      <div className="flex-1">
        <BreadcrumbDynamic />
      </div>
      <div className="flex items-center gap-4">
        {/* Informações do usuário */}
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-primary-foreground/20"></div>
            <div className="flex flex-col gap-1">
              <div className="h-4 w-24 bg-primary-foreground/20 rounded"></div>
              <div className="h-3 w-16 bg-primary-foreground/20 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-foreground/20 text-primary-foreground font-bold text-sm">
              {getUserInitials()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm text-primary-foreground">
                {getUserFullName()}
              </span>
              <span className="text-xs text-primary-foreground/80">
                {user ? roleToLabel(user.role, user.is_client) : "Cargo Indefinido"}
              </span>
            </div>
          </div>
        )}
        
        {/* Divisor */}
        <div className="h-6 w-px bg-primary-foreground/20"></div>
        
        {/* Controles de ação - com estilos customizados para o fundo primary */}
        <div className="flex items-center gap-2">
          <NotificationPopover />
          <div className="[&>button]:text-primary-foreground [&>button:hover]:bg-primary-foreground/10 [&>button:hover]:text-primary-foreground [&_svg]:text-primary-foreground">
            <ThemeSwitcher />
          </div>
          <div className="[&>button]:text-primary-foreground [&>button:hover]:bg-destructive [&>button:hover]:text-destructive-foreground">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}