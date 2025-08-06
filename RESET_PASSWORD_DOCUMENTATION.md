# Sistema de Reset de Senha com Token

## Visão Geral
O sistema de reset de senha implementado oferece duas maneiras para o usuário redefinir sua senha:

### 1. **Via Link do Email** (Automático)
- Quando o usuário clica no link recebido por email o sistema automaticamente estabelece uma sessão de recuperação e mostra apenas os campos de nova senha e confirmação.
- Não requer inserção manual de token

### 2. **Via Token Manual**
- Para casos onde o link do email não funciona, o usuário copia o token do email e cola manualmente

## Experiência do Usuário

### Cenário 1: Link do Email Funciona
1. Usuário solicita reset via "Esqueceu sua Senha?"
2. Recebe email com link
3. Clica no link → vai direto para tela de nova senha
4. Define nova senha → redireciona para login

### Cenário 2: Link do Email Não Funciona
1. Usuário clica em "Tem um Token de Redefinição?"
2. Ve interface com opções "Token Manual" e "Redefinir com Link"
3. Seleciona "Token Manual"
4. Cola o token do email + define nova senha
5. Redireciona para login

### Cenário 3: Flexibilidade Total
- Usuário pode alternar entre os modos mesmo na tela de reset
- Feedback visual claro sobre qual modo está ativo
- Validações em tempo real
- Mensagens de erro e sucesso apropriadas