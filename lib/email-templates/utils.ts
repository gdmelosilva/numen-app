/**
 * Utilitários para URLs e assets
 */

/**
 * Obtém a URL base do aplicativo para uso em emails
 * Prioridade: variável de ambiente > URL de produção padrão
 */
export function getBaseUrl(): string {
  // Em produção, usar a URL do ambiente
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://numenit-ops.com';
  }
  
  // Em desenvolvimento, usar localhost
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Gera URL completa para assets públicos
 */
export function getAssetUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Gera URL para a logo do sistema
 */
export function getLogoUrl(): string {
  return getAssetUrl('/LOGO%20CLARO%201@2x.png');
}
