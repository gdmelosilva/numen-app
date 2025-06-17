# Validações de Negócio - Sistema de Horas e Mensagens

## Resumo das Regras Implementadas

### 1. Apontamento de Horas
- **Usuário suspenso**: Não pode apontar horas se `is_active = false`
- **Horas extrapoladas**: Não pode apontar se as horas do contrato (`hours_max`) foram extrapoladas
- **Usuário não vinculado**: Deve estar vinculado ao projeto (`project_resources`)

### 2. Envio de Mensagens
- **Usuário suspenso**: Não pode enviar mensagens se `is_active = false`
- **Usuário cliente não vinculado**: Funcional Administrativo/Key-User Cliente só pode enviar mensagens se estiver no contrato
- **Usuário suspenso no projeto**: Não pode enviar mensagens se `is_suspended = true` no `project_resources`

## Hooks Implementados

### `useCanUserLogHours`
```typescript
const { canLog, reason, loading, userProjectHours } = useCanUserLogHours(projectId, contractHoursMax);
```

**Parâmetros:**
- `projectId`: ID do projeto
- `contractHoursMax`: Limite máximo de horas do contrato

**Retorna:**
- `canLog`: boolean - Se o usuário pode apontar horas
- `reason`: string - Motivo da restrição (se houver)
- `loading`: boolean - Se está carregando
- `userProjectHours`: number - Horas já apontadas pelo usuário no projeto

### `useCanUserSendMessage`
```typescript
const { canSend, reason, isClient } = useCanUserSendMessage(projectId, userInContract);
```

**Parâmetros:**
- `projectId`: ID do projeto
- `userInContract`: boolean - Se o usuário está vinculado ao contrato

**Retorna:**
- `canSend`: boolean - Se o usuário pode enviar mensagens
- `reason`: string - Motivo da restrição (se houver)
- `isClient`: boolean - Se o usuário é cliente

### `useUserInContract`
```typescript
const { userInContract, loading } = useUserInContract(projectId);
```

**Parâmetros:**
- `projectId`: ID do projeto

**Retorna:**
- `userInContract`: boolean | null - Se o usuário está vinculado ao contrato
- `loading`: boolean - Se está carregando

## Componentes de Validação

### `MessageValidationWrapper`
Componente wrapper que valida permissões antes de renderizar componentes filhos:

```typescript
<MessageValidationWrapper 
  projectId={projectId}
  contractHoursMax={contractHoursMax}
  showHoursValidation={true}
  showMessageValidation={true}
>
  {/* Seus componentes aqui */}
</MessageValidationWrapper>
```

### `MessageFormWithValidation`
Formulário de mensagem com validações integradas:

```typescript
<MessageForm 
  projectId={projectId}
  contractHoursMax={contractHoursMax}
  onSubmit={handleSubmit}
/>
```

## APIs Atualizadas

### `/api/ticket-hours` (POST)
Agora inclui validações de negócio:
- Verifica se usuário está ativo
- Verifica se usuário está vinculado ao projeto
- Verifica se horas do contrato não foram extrapoladas
- Retorna erro específico para cada situação

### `/api/messages` (POST)
Agora inclui validações de negócio:
- Verifica se usuário está ativo
- Para usuários clientes, verifica se estão vinculados ao contrato
- Verifica se usuário não está suspenso no projeto
- Retorna erro específico para cada situação

## Exemplos de Uso

### Validando antes de mostrar formulário de horas
```typescript
const { canLog, reason } = useCanUserLogHours(projectId, contractHoursMax);

if (!canLog) {
  return <div className="error">{reason}</div>;
}

return <HoursForm projectId={projectId} />;
```

### Validando antes de mostrar formulário de mensagem
```typescript
const { userInContract } = useUserInContract(projectId);
const { canSend, reason } = useCanUserSendMessage(projectId, userInContract);

if (!canSend) {
  return <div className="error">{reason}</div>;
}

return <MessageForm projectId={projectId} />;
```

### Usando o wrapper de validação
```typescript
<MessageValidationWrapper 
  projectId={projectId}
  contractHoursMax={contract.hours_max}
  showMessageValidation={true}
>
  <MessageForm onSubmit={handleSubmit} />
</MessageValidationWrapper>
```

## Mensagens de Erro

### Apontamento de Horas
- "Usuário está suspenso/inativo"
- "Horas do contrato extrapoladas"
- "Usuário não está vinculado ao projeto"
- "Apontamento excede o limite de horas do contrato. Limite: Xh, Já utilizado: Yh, Tentativa de adicionar: Zh"

### Envio de Mensagens
- "Usuário está suspenso/inativo e não pode enviar mensagens"
- "Usuário não está vinculado a este contrato e não pode enviar mensagens"
- "Usuário está suspenso neste projeto e não pode enviar mensagens"

## Observações Técnicas

1. **Performance**: Os hooks fazem cache das consultas e só revalidam quando necessário
2. **Tipo Safety**: Todos os componentes e hooks são tipados com TypeScript
3. **Error Handling**: Todas as APIs retornam erros específicos para facilitar debugging
4. **Validação Client-Side**: As validações são feitas tanto no frontend quanto no backend
5. **Responsividade**: Os componentes são responsivos e seguem as boas práticas do Tailwind CSS

## Próximos Passos

Para implementar completamente o sistema:

1. **Atualizar componentes existentes** para usar os novos hooks de validação
2. **Adicionar indicadores visuais** nos tickets para mostrar o status do usuário
3. **Implementar validação de visualização** de tickets (usuários não vinculados não veem tickets)
4. **Adicionar logs de auditoria** para rastrear tentativas de acesso negadas
5. **Criar relatórios** de uso de horas por contrato/usuário
