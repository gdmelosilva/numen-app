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

export { ticketCreatedTemplate } from './ticket-created';
export { ticketUpdatedTemplate } from './ticket-updated';
export type { TicketUpdatedTemplateData } from './ticket-updated';
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
  type: 'ticket-created' | 'ticket-updated',
  data: EmailTemplateData | TicketUpdatedTemplateData,
  baseUrl?: string
): EmailTemplate {
  switch (type) {
    case 'ticket-created':
      return ticketCreatedTemplate(data as EmailTemplateData, baseUrl);
    case 'ticket-updated':
      return ticketUpdatedTemplate(data as TicketUpdatedTemplateData);
    default:
      throw new Error(`Template type "${type}" not found`);
  }
}

// Função legacy para compatibilidade (manter por enquanto)
export function generateTicketCreatedEmailTemplate(data: EmailTemplateData, baseUrl?: string): EmailTemplate {
  return generateEmailTemplate('ticket-created', data, baseUrl);
}
