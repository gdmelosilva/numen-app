/**
 * Utilitários para verificar status de tickets
 */

import type { Ticket } from "@/types/tickets";

/**
 * Verifica se um ticket está finalizado
 * Um ticket é considerado finalizado se tem status "Finalizado"
 */
export function isTicketFinalized(ticket: Ticket | null | undefined): boolean {
  if (!ticket) return false;
  
  // Verifica pelo status objeto
  if (typeof ticket.status === 'object' && ticket.status !== null) {
    const statusName = ticket.status.name?.toLowerCase() || '';
    return statusName === 'finalizado';
  }
  
  // Se não tiver o objeto status, não podemos determinar
  return false;
}

/**
 * Obtém a mensagem de erro padrão para tickets finalizados
 */
export function getTicketFinalizedMessage(): string {
  return "Este chamado está finalizado e não permite mais alterações.";
}
