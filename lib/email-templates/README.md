# Email Templates - EasyTime

Este diretório contém todos os templates de email utilizados no sistema EasyTime, organizados de forma modular para facilitar a manutenção e extensibilidade.

## Estrutura

```
email-templates/
├── index.ts              # Arquivo principal com tipos e função geral
├── styles.ts             # Estilos CSS inline e constantes visuais
├── utils.ts              # Utilitários para URLs e assets
├── ticket-created.ts     # Template para novos chamados
├── ticket-updated.ts     # Template para chamados atualizados (exemplo)
└── README.md            # Este arquivo
```

## Uso Básico

### Importar e usar templates

```typescript
import { generateEmailTemplate, EmailTemplateData } from '@/lib/email-templates';

// Dados para o template
const emailData: EmailTemplateData = {
  ticketId: '123',
  ticketExternalId: 'AMS-001',
  ticketTitle: 'Problema no sistema',
  ticketDescription: 'Descrição detalhada do problema...',
  projectName: 'Projeto ABC',
  partnerName: 'Empresa XYZ',
  clientName: 'João Silva',
  clientEmail: 'joao@empresa.com',
  categoryName: 'Incidente'
};

// Gerar template (a URL da logo será configurada automaticamente)
const emailTemplate = generateEmailTemplate('ticket-created', emailData);

// Ou especificar uma URL base customizada
const emailTemplateCustom = generateEmailTemplate('ticket-created', emailData, 'https://meudominio.com');

// Enviar email
await sendOutlookMail({
  to: 'destinatario@email.com',
  subject: emailTemplate.subject,
  html: emailTemplate.html,
  text: emailTemplate.text
});
```

### Configuração de URLs

Os templates utilizam automaticamente a logo do sistema através das seguintes configurações:

#### 1. Variáveis de Ambiente
```bash
# .env.local ou .env
NEXT_PUBLIC_BASE_URL=https://easytime.numenit.com
```

#### 2. URLs Automáticas
- **Produção**: `https://easytime.numenit.com` (padrão)
- **Desenvolvimento**: `http://localhost:3000` (padrão)

#### 3. URL Customizada
```typescript
// Especificar URL base customizada
const template = generateEmailTemplate('ticket-created', data, 'https://meudominio.com');
```

### Assets e Logo

A logo do sistema é automaticamente incluída nos templates de email:

- **Arquivo**: `/public/LOGO CLARO 1@2x.png`
- **Dimensões**: Altura fixa de 60px, largura automática
- **Fallback**: Texto "EasyTime" caso a imagem não carregue
- **Alt text**: "EasyTime - Sistema de Gestão de Chamados"

### Templates Disponíveis

#### 1. `ticket-created`
Template para notificação de novos chamados criados.

**Dados necessários:**
- `ticketId`: ID interno do chamado
- `ticketExternalId`: ID externo do chamado (opcional)
- `ticketTitle`: Título do chamado
- `ticketDescription`: Descrição do chamado
- `projectName`: Nome do projeto
- `partnerName`: Nome do parceiro
- `clientName`: Nome do cliente que criou
- `clientEmail`: Email do cliente
- `categoryName`: Categoria do chamado (opcional)

#### 2. `ticket-updated` (exemplo para futura implementação)
Template para notificação de atualizações em chamados.

## Criando Novos Templates

### 1. Criar arquivo do template

Crie um novo arquivo na pasta `email-templates/` seguindo o padrão:

```typescript
// email-templates/meu-template.ts
import { EmailTemplate } from './index';

export interface MeuTemplateData {
  // Definir interface dos dados necessários
  campo1: string;
  campo2?: string;
}

export function meuTemplate(data: MeuTemplateData): EmailTemplate {
  return {
    subject: `Assunto: ${data.campo1}`,
    html: `<!-- HTML do template -->`,
    text: `Texto do template`
  };
}
```

### 2. Exportar no index.ts

```typescript
// Adicionar import e export
import { meuTemplate } from './meu-template';
export { meuTemplate } from './meu-template';

// Adicionar case no switch da função generateEmailTemplate
export function generateEmailTemplate(
  type: 'ticket-created' | 'meu-template', // Adicionar novo tipo
  data: EmailTemplateData | MeuTemplateData // Adicionar novo tipo de dados
): EmailTemplate {
  switch (type) {
    case 'ticket-created':
      return ticketCreatedTemplate(data as EmailTemplateData);
    case 'meu-template':
      return meuTemplate(data as MeuTemplateData);
    default:
      throw new Error(`Template type "${type}" not found`);
  }
}
```

## Estilos

Os estilos CSS inline estão organizados no arquivo `styles.ts` para facilitar a reutilização e manutenção:

```typescript
import { emailStyles, textTemplateStyles } from '@/lib/email-templates/styles';

// Usar estilos predefinidos
const html = `
  <div style="${emailStyles.container}">
    <div style="${emailStyles.card}">
      <h2 style="${emailStyles.title}">Título</h2>
    </div>
  </div>
`;
```

## Boas Práticas

### 1. Responsividade
- Usar `max-width: 600px` para o container principal
- Testar em diferentes clientes de email
- Usar `table` para layouts complexos quando necessário

### 2. Compatibilidade
- Usar CSS inline para máxima compatibilidade
- Evitar CSS moderno (flexbox, grid) em emails
- Sempre fornecer versão de texto alternativo

### 3. Acessibilidade
- Usar cores com bom contraste
- Fornecer texto alternativo para imagens
- Estruturar HTML semanticamente

### 4. Performance
- Otimizar imagens (se houver)
- Manter HTML enxuto
- Evitar JavaScript

## Testando Templates

### Testando a Logo

Para verificar se a logo está sendo carregada corretamente:

1. **Em desenvolvimento local:**
   ```bash
   # Certifique-se de que o arquivo existe
   http://localhost:3000/LOGO%20CLARO%201@2x.png
   ```

2. **Verificar URL gerada:**
   ```typescript
   import { getLogoUrl } from '@/lib/email-templates';
   console.log('URL da logo:', getLogoUrl());
   ```

3. **Testar template completo:**
   ```typescript
   import { generateEmailTemplate } from '@/lib/email-templates';
   
   const template = generateEmailTemplate('ticket-created', {
     // ... dados do teste
   });
   
   // Verificar se a URL da logo está correta no HTML
   console.log(template.html.includes('LOGO%20CLARO%201@2x.png'));
   ```

### Testando em Produção

Para testar templates durante desenvolvimento:

1. Habilitar modo de teste na API:
```typescript
const TEST_MODE = true;
const TEST_EMAIL = "seu-email@teste.com";
```

2. Criar um ticket de teste
3. Verificar se o email foi recebido corretamente
4. Confirmar se a logo aparece nos clientes de email

### Fallbacks

O template inclui fallbacks para garantir que sempre funcione:

- **Logo não carrega**: Mostra texto "EasyTime" 
- **URL inválida**: Usa URL padrão configurada
- **Cliente não suporta imagens**: Alt text descritivo

## Versionamento

Ao fazer alterações em templates:

1. Considere compatibilidade com dados existentes
2. Documente mudanças significativas
3. Teste em ambiente de desenvolvimento primeiro
4. Mantenha função legacy se necessário para compatibilidade

## Exemplo Completo

```typescript
// Uso em uma API route
import { generateEmailTemplate, EmailTemplateData } from '@/lib/email-templates';
import { sendOutlookMail } from '@/lib/sendOutlookMail';

export async function POST(req: Request) {
  // ... lógica de criação do ticket ...
  
  // Preparar dados do email
  const emailData: EmailTemplateData = {
    ticketId: ticket.id.toString(),
    ticketExternalId: ticket.external_id,
    ticketTitle: ticket.title,
    ticketDescription: ticket.description,
    projectName: project.name,
    partnerName: partner.name,
    clientName: user.name,
    clientEmail: user.email,
    categoryName: category?.name
  };
  
  // Gerar e enviar email
  const template = generateEmailTemplate('ticket-created', emailData);
  
  await sendOutlookMail({
    to: recipient.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}
```
