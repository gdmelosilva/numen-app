# Teste de Visibilidade do Campo Category_ID

## Implementação Realizada

1. **Adicionada prop `isAms`** no componente `CreateActivityDialog`:
   - Tipo: `boolean` opcional com padrão `false`
   - Localização: `interface CreateTicketDialogProps`

2. **Condicionado a exibição do campo category_id**:
   - O campo "Tipo Chamado" só aparece quando `isAms === false`
   - Implementação: `{!isAms && (<div>...campo category_id...</div>)}`

3. **Ajustada a validação**:
   - Campo category_id só é obrigatório quando `isAms === false`
   - Validação: `(!isAms && !form.category_id)`

4. **Ajustado o envio de dados**:
   - category_id só é incluído no FormData e JSON quando `isAms === false`
   - Tanto para requisições com anexo quanto sem anexo

5. **Atualizado ProjectTicketsTab**:
   - Passando `isAms={false}` para o componente no contexto SmartBuild

## Comportamento Esperado

### SmartBuild (isAms = false)
- ✅ Campo "Tipo Chamado" é exibido
- ✅ category_id é obrigatório na validação
- ✅ category_id é enviado na requisição

### SmartCare AMS (isAms = true)
- ✅ Campo "Tipo Chamado" é oculto
- ✅ category_id não é obrigatório na validação
- ✅ category_id não é enviado na requisição

## Observação
O componente CreateActivityDialog é usado APENAS no contexto SmartBuild.
Para projetos AMS, é usado o componente CreateTicketDialog (diferente).
Portanto, nossa implementação mantém compatibilidade total.
