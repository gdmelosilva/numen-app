import { Badge } from "./badge";
import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// Badge variants type alias
export type BadgeVariant =
  | "accent"
  | "primary"
  | "approved"
  | "destructive"
  | "secondary"
  | "outline"
  | "primary-2"
  | "default"
  | "ghost";

// Centralized color/label maps
const typeColorMap: Record<string, BadgeVariant> = {
  AMS: "accent",
  BSHOP: "primary",
  TKEY: "approved",
};
const typeLabelMap: Record<string, string> = {
  AMS: "AMS",
  BSHOP: "Bodyshop",
  TKEY: "Turnkey",
};
// Mapeamento para status de projeto conforme tabela
const statusColorMap: Record<string, BadgeVariant> = {
  cyan: 'approved',        // Ativo
  orange: 'primary',      // Em Analise
  purple: 'accent',       // Em Mobilização
  red: 'destructive',     // Encerrado
  colorless: 'outline',   // Suspenso
};

// Mapeamento para status de projeto
const projectStatusColorMap: Record<string, BadgeVariant> = {
  Ativo: "approved",
  Encerrado: "destructive",
  Pendente: "outline",
  "Em andamento": "primary",
  Suspenso: "secondary",
  // Adicione outros status conforme necessário
};

// Mapeamento para cargos de usuário
const userRoleColorMap: Record<string, BadgeVariant> = {
  Administrador: "destructive",
  Gerente: "accent",
  "Key-User": "secondary",
  Funcional: "approved",
  Indefinido: "outline",
};
const userRoleLabelMap: Record<string, string> = {
  Administrador: "Administrador",
  Gerente: "Gerente",
  "Key-User": "Key-User",
  Funcional: "Funcional",
  Indefinido: "Indefinido",
};

const isClientColorMap: Record<string, BadgeVariant> = {
  Cliente: "ghost",
  Administrativo: "primary",
};
const isClientLabelMap: Record<string, string> = {
  Cliente: "Cliente",
  Administrativo: "Administrativo",
};

// Mapeamento para prioridade de ticket
const ticketPriorityColorMap: Record<string, BadgeVariant> = {
  Alta: "destructive",
  Média: "accent",
  Baixa: "secondary",
  Urgente: "primary",
};
const ticketPriorityLabelMap: Record<string, string> = {
  Alta: "Alta",
  Média: "Média",
  Baixa: "Baixa",
  Urgente: "Urgente",
};
function renderTicketPriorityBadge(value: string | boolean | { name: string; color: string } | null | undefined, className?: string) {
  const label = ticketPriorityLabelMap[String(value)] ?? String(value);
  const variant = ticketPriorityColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

// Mapeamento para tipo de ticket
const ticketTypeColorMap: Record<string, BadgeVariant> = {
  Incidente: "destructive",
  Requisição: "primary",
  Problema: "accent",
  "Mudança": "secondary",
};
const ticketTypeLabelMap: Record<string, string> = {
  Incidente: "Incidente",
  Requisição: "Requisição",
  Problema: "Problema",
  Mudança: "Mudança",
};
function renderTicketTypeBadge(value: string | boolean | { name: string; color: string } | null | undefined, className?: string) {
  const label = ticketTypeLabelMap[String(value)] ?? String(value);
  const variant = ticketTypeColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export interface ColoredBadgeProps {
  value: string | boolean | { name: string; color: string } | null | undefined;
  type: "project_type" | "status" | "boolean" | "project_status" | "user_role" | "is_client" | "priority" | "ticket_type";
  statusColor?: string; // para status que vem com cor
  className?: string;
}


function renderProjectTypeBadge(value: string | boolean | { name: string; color: string } | null | undefined, className?: string) {
  const variant = typeColorMap[String(value)] ?? "default";
  const label = typeLabelMap[String(value)] ?? String(value);
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function isNameColorObject(val: unknown): val is { name: string; color: string } {
  return (
    typeof val === 'object' &&
    val !== null &&
    typeof (val as { name?: unknown }).name === 'string' &&
    typeof (val as { color?: unknown }).color === 'string'
  );
}

function renderProjectStatusBadge(
  value: string | boolean | { name: string; color: string } | null | undefined,
  className?: string
) {
  if (isNameColorObject(value)) {
    const label = value.name;
    const variant = statusColorMap[value.color] ?? 'outline';
    return <Badge variant={variant} className={className}>{label}</Badge>;
  }
  if (typeof value === 'string') {
    const label = value;
    const variant = projectStatusColorMap[value] ?? 'outline';
    return <Badge variant={variant} className={className}>{label}</Badge>;
  }
  return <span>{String(value)}</span>;
}

function renderStatusBadge(
  value: string | boolean | { name: string; color: string } | null | undefined,
  _statusColor?: string,
  className?: string
) {
  let label = "-";
  if (typeof value === "boolean") label = value ? "Ativo" : "Inativo";
  else if (typeof value === "string") {
    if (value.toLowerCase() === "true" || value === "1") label = "Ativo";
    else if (value.toLowerCase() === "false" || value === "0") label = "Inativo";
    else label = value;
  }
  const variant = statusColorMap[label] ?? "outline";
  if (label === "Ativo") {
    return (
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4 inline text-approved" />Ativo
      </span>
    );
  }
  if (label === "Inativo") {
    return (
      <span className="flex items-center gap-1">
        <XCircle className="w-4 h-4 inline text-destructive" />Inativo
      </span>
    );
  }
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

// Mapeamento para booleano simples (Sim/Não)
function renderBooleanBadge(
  value: string | boolean | { name: string; color: string } | null | undefined
) {
  let label = "-";
  if (typeof value === "boolean") label = value ? "Sim" : "Não";
  else if (typeof value === "string") {
    if (value.toLowerCase() === "true" || value === "1" || value === "sim") label = "Sim";
    else if (value.toLowerCase() === "false" || value === "0" || value === "não" || value === "nao") label = "Não";
    else label = value;
  }
  if (label === "Sim") {
    return (
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4 inline text-approved" />Sim
      </span>
    );
  }
  if (label === "Não") {
    return (
      <span className="flex items-center gap-1">
        <XCircle className="w-4 h-4 inline text-destructive" />Não
      </span>
    );
  }
  return <span>{label}</span>;
}

function renderUserRoleBadge(value: string | boolean | { name: string; color: string } | null | undefined, className?: string) {
  const label = userRoleLabelMap[String(value)] ?? String(value);
  const variant = userRoleColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function renderIsClientBadge(
  value: string | boolean | { name: string; color: string } | null | undefined,
  className?: string
) {
  let label = "-";
  if (typeof value === "boolean") {
    label = value ? "Cliente" : "Administrativo";
  } else if (typeof value === "string") {
    label = isClientLabelMap[value] ?? value;
  } else if (isNameColorObject(value)) {
    label = isClientLabelMap[value.name] ?? value.name;
  }
  const variant = isClientColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function ColoredBadge({ value, type, statusColor, className }: Readonly<ColoredBadgeProps>) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case "project_type":
      return renderProjectTypeBadge(value, className);
    case "project_status":
      return renderProjectStatusBadge(value, className);
    case "status":
      return renderStatusBadge(value, statusColor, className);
    case "boolean":
      return renderBooleanBadge(value);
    case "user_role":
      return renderUserRoleBadge(value, className);
    case "is_client":
      return renderIsClientBadge(value, className);
    case "priority":
      return renderTicketPriorityBadge(value, className);
    case "ticket_type":
      return renderTicketTypeBadge(value, className);
    default:
      return <span>{String(value)}</span>;
  }
}
