import { Badge } from "./badge";
import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// Badge variants type alias
export type BadgeVariant =
  | "orange"
  | "accent"
  | "primary"
  | "approved"
  | "destructive"
  | "secondary"
  | "outline"
  | "primary-2"
  | "default"
  | "ghost"
  | "ticket-yellow"
  | "ticket-orange"
  | "ticket-purple"
  | "ticket-gray"
  | "ticket-cyan"
  | "ticket-green";

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
  cyan: 'approved',      // Ativo
  orange: 'orange',  // Em Analise
  purple: 'accent',  // Em Mobilização
  red: 'destructive',       // Encerrado
  colorless: 'outline',     // Suspenso
  gray: 'ticket-gray',      // Ticket - Ag.Atendimento
  yellow: 'ticket-yellow',  // Amarelo
  green: 'ticket-green',    // Verde
  blue: 'primary'
};

// Mapeamento específico para status de tickets baseado na tabela ticket_status
const ticketStatusColorMap: Record<string, BadgeVariant> = {
  "Ag. Atendimento": "ticket-gray",            // gray
  "Em Analise": "ticket-yellow",                      // yellow  
  "Enc. para o Atendente": "ticket-gray",        // gray
  "Finalizado": "ticket-green",                       // green
  "Enc. para o Solicitante": "ticket-orange",  // orange
  "Na Fábrica": "ticket-purple", // purple
  "Em Estimativa": "ticket-orange",                   // orange
  "Ag. Apr. do Solicitante": "ticket-yellow", // yellow
  "Enc. para Encerramento": "ticket-green",    // green
  "Ag. Valid. Solicitante": "ticket-cyan", // cyan
  "Ag. Alocação ABAP": "ticket-cyan", // cyan
  "Ag. Testes Solicitante": "ticket-cyan", // cyan
};

// Função para determinar a cor baseada no status name e color da tabela
function getTicketStatusVariant(status: { name: string; color?: string } | string): BadgeVariant {
  if (typeof status === 'string') {
    return ticketStatusColorMap[status] ?? 'outline';
  }
  
  if (status.color) {
    return statusColorMap[status.color] ?? 'outline';
  }
  
  return ticketStatusColorMap[status.name] ?? 'outline';
}

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
  Alta: "orange",
  Média: "approved",
  Baixa: "primary",
  Crítica: "destructive",
};
const ticketPriorityLabelMap: Record<string, string> = {
  Alta: "Alta",
  Média: "Média",
  Baixa: "Baixa",
  Crítica: "Crítica",
};
function renderTicketPriorityBadge(value: ValueType, className?: string) {
  const label = ticketPriorityLabelMap[String(value)] ?? String(value);
  const variant = ticketPriorityColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

// Mapeamento para tipo de ticket
const ticketTypeColorMap: Record<string, BadgeVariant> = {
  Incidente: "destructive",
  Melhoria: "accent",
  "Problema Recorrente": "orange",
  "Dúvida": "ticket-yellow",
  "Manutenção": "ticket-purple",
  "Plantão 24/7": "ticket-purple"
};
const ticketTypeLabelMap: Record<string, string> = {
  Incidente: "Incidente",
  Melhoria: "Melhoria",
  "Problema Recorrente": "Problema Recorrente",
  "Dúvida": "Dúvida",
  "Manutenção": "Manutenção",
  "Plantão 24/7": "Plantão 24/7"
};
function renderTicketTypeBadge(value: ValueType, className?: string) {
  const label = ticketTypeLabelMap[String(value)] ?? String(value);
  const variant = ticketTypeColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function renderTicketStatusBadge(
  value: ValueType, 
  className?: string
) {
  if (isNameColorObject(value)) {
    const label = value.name;
    const variant = getTicketStatusVariant(value);
    return <Badge variant={variant} className={className}>{label}</Badge>;
  }
  
  if (typeof value === 'string') {
    const label = value;
    const variant = getTicketStatusVariant(value);
    return <Badge variant={variant} className={className}>{label}</Badge>;
  }
  
  return <span>{String(value)}</span>;
}

// Tipos mais flexíveis para objetos de status/valor
type ValueType = string | boolean | { name: string; color?: string; id?: number } | null | undefined;

export interface ColoredBadgeProps {
  value: ValueType;
  type: "project_type" | "status" | "boolean" | "project_status" | "user_role" | "is_client" | "priority" | "ticket_type" | "ticket_status" | "suspended" | "comp_adm" | "module";
  statusColor?: string; // para status que vem com cor
  className?: string;
}


function renderProjectTypeBadge(value: ValueType, className?: string) {
  const variant = typeColorMap[String(value)] ?? "default";
  const label = typeLabelMap[String(value)] ?? String(value);
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function isNameColorObject(val: unknown): val is { name: string; color?: string; id?: number } {
  return (
    typeof val === 'object' &&
    val !== null &&
    typeof (val as { name?: unknown }).name === 'string'
  );
}

function renderProjectStatusBadge(
  value: ValueType,
  className?: string
) {
  if (isNameColorObject(value)) {
    const label = value.name;
    const variant = value.color ? statusColorMap[value.color] ?? 'outline' : 'outline';
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
  value: ValueType,
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

function renderBooleanBadge(
  value: ValueType
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

function renderUserRoleBadge(value: ValueType, className?: string) {
  const label = userRoleLabelMap[String(value)] ?? String(value);
  const variant = userRoleColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function renderIsClientBadge(
  value: ValueType,
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

function renderIsCompAdmBadge(
  value: ValueType,
  className?: string
) {
  let label = "-";
  if (typeof value === "boolean") {
    label = value ? "Administrativo" : "Genérico";
  } else if (typeof value === "string") {
    label = isClientLabelMap[value] ?? value;
  } else if (isNameColorObject(value)) {
    label = isClientLabelMap[value.name] ?? value.name;
  }
  const variant = isClientColorMap[label] ?? "outline";
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

function renderSuspendedBadge(
  value: ValueType
) {
  let label = "-";
  if (typeof value === "boolean") label = value ? "Suspenso" : "Mobilizado";
  else if (typeof value === "string") {
    if (value.toLowerCase() === "true" || value === "1" || value === "suspenso") label = "Suspenso";
    else if (value.toLowerCase() === "false" || value === "0" || value === "mobilizado") label = "Mobilizado";
    else label = value;
  }
  if (label === "Mobilizado") {
    return (
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-4 h-4 inline text-approved" />Mobilizado
      </span>
    );
  }
  if (label === "Suspenso") {
    return (
      <span className="flex items-center gap-1">
        <XCircle className="w-4 h-4 inline text-destructive" />Suspenso
      </span>
    );
  }
  return <span>{label}</span>;
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
    case "ticket_status":
      return renderTicketStatusBadge(value, className);
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
    case "module":
      return <Badge variant="outline" className={className}>{String(value)}</Badge>;
    case "suspended":
      return renderSuspendedBadge(value);
    case "comp_adm":
      return renderIsCompAdmBadge(value, className);
    default:
      return <span>{String(value)}</span>;
  }
}
