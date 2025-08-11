"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  getBreadcrumbLabel,
} from "@/components/ui/breadcrumb";

export function BreadcrumbDynamic() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Não exibe breadcrumb na página principal /main
  if (pathname === "/main" || segments.length === 1) {
    return null;
  }

  // Mapeia os nomes traduzidos sem alterar os segmentos originais
  const translatedSegments = segments.map((segment) => {
    if (segment === "main") return "Página Principal";
    if (segment === "admin") return "Administrativo";
    if (segment === "users") return "Usuários";
    if (segment === "smartbuild") return "Smartbuild";
    if (segment === "smartcare") return "Smartcare";
    if (segment === "contracts") return "Contratos";
    if (segment === "tickets") return "Tickets";
    if (segment === "messages") return "Mensagens";
    if (segment === "partners") return "Parceiros";
    if (segment === "management") return "Administrar";
    if (segment === "create") return "Abrir";
    if (segment === "roles") return "Cargos";
    if (segment === "utils") return "Utilitários";
    return "Detalhes";
  });

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-primary-foreground">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          // Rotas que não devem ser clicáveis
          const nonClickable = [
            "Administrativo",
            "Smartcare",
            "Smartbuild",
            "TimeSheet",
            "Utilitários",
            "Timeflow",
          ];
          const label = getBreadcrumbLabel(
            translatedSegments[index].replace(/-/g, " ")
          );
          const isNonClickable = nonClickable.includes(label);

          return (
            <BreadcrumbItem key={href}>
              {index > 0 && <BreadcrumbSeparator className="text-primary-foreground" />}
              {isLast || isNonClickable ? (
                <BreadcrumbPage className="capitalize text-primary-foreground font-medium">{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  href={href} 
                  className="capitalize text-primary-foreground hover:text-primary-foreground transition-colors border-b border-transparent hover:border-primary-foreground hover:border-b-1 font-bold"
                >
                  {label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}