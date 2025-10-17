// Tipos e interfaces
export interface EmailTemplateData {
  ticketId: string;
  ticketExternalId?: string;
  ticketTitle: string;
  ticketDescription: string;
  projectName: string;
  partnerName: string;
  clientName: string;
  clientEmail: string;
  categoryName?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Importar templates específicos
import { ticketCreatedTemplate } from './ticket-created';
import { ticketUpdatedTemplate, type TicketUpdatedTemplateData } from './ticket-updated';
import { ticketAssignedTemplate, type TicketAssignedTemplateData } from './ticket-assigned';
import { createUserTemplate, type CreateUserTemplateData } from './createuser';
export { ticketCreatedTemplate } from './ticket-created';
export { ticketUpdatedTemplate } from './ticket-updated';
export { ticketAssignedTemplate } from './ticket-assigned';
export type { TicketUpdatedTemplateData } from './ticket-updated';
export type { TicketAssignedTemplateData } from './ticket-assigned';
export { emailStyles, textTemplateStyles } from './styles';
export { getBaseUrl, getAssetUrl, getLogoUrl } from './utils';

// Função principal para gerar templates por tipo
export function generateEmailTemplate(
  type: 'ticket-created',
  data: EmailTemplateData,
  baseUrl?: string
): EmailTemplate;
export function generateEmailTemplate(
  type: 'ticket-updated',
  data: TicketUpdatedTemplateData,
  baseUrl?: string
): EmailTemplate;
export function generateEmailTemplate(
  type: 'ticket-assigned',
  data: TicketAssignedTemplateData,
  baseUrl?: string
): EmailTemplate;
export function generateEmailTemplate(
  type: 'create-user',
  data: CreateUserTemplateData,
  baseUrl?: string
): EmailTemplate;
export function generateEmailTemplate(
  type: 'ticket-created' | 'ticket-updated' | 'ticket-assigned' | 'create-user',
  data: EmailTemplateData | TicketUpdatedTemplateData | TicketAssignedTemplateData | CreateUserTemplateData,
  baseUrl?: string
): EmailTemplate {
  switch (type) {
    case 'ticket-created':
      return ticketCreatedTemplate(data as EmailTemplateData, baseUrl);
    case 'ticket-updated':
      return ticketUpdatedTemplate(data as TicketUpdatedTemplateData);
    case 'ticket-assigned':
      return ticketAssignedTemplate(data as TicketAssignedTemplateData, baseUrl);
    case 'create-user':
      return createUserTemplate(data as CreateUserTemplateData)
    default:
      throw new Error(`Tipo de template não suportado: ${type}`);
  }
}


// Função legacy para compatibilidade (manter por enquanto)
export function generateTicketCreatedEmailTemplate(data: EmailTemplateData, baseUrl?: string): EmailTemplate {
  return generateEmailTemplate('ticket-created', data, baseUrl);
}
