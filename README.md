# Numen App

## Visão Geral

Este projeto é um sistema de gestão de contratos, parceiros, usuários, chamados e atividades, desenvolvido em Next.js com Supabase, Tailwind CSS e shadcn/ui. O objetivo é facilitar a administração de contratos AMS, Bodyshop e Turnkey, além de gerenciar recursos, tickets e integrações.

---

## Funcionalidades Principais

- Gestão de usuários, parceiros e contratos
- Controle de alocação de recursos em projetos
- Gestão de chamados (tickets) e atividades
- Filtros avançados e exportação de dados (Excel)
- Autenticação e autorização com Supabase
- Interface moderna com Tailwind CSS e shadcn/ui
- Deploy facilitado na Vercel

---

## O que já foi feito

- [X] Validação de senha e mensagens de erro em português
- [X] Sidebar dinâmica conforme role do usuário
- [X] CRUD completo de parceiros e contratos
- [X] Filtros avançados em tabelas (segmento, status, tipo, etc)
- [X] Exportação para Excel
- [X] Detalhes completos de contratos e parceiros
- [X] Alocação e vinculação de recursos a projetos
- [X] Ajustes de layout, badges, e campos formatados
- [X] Integração com Supabase para autenticação e dados
- [X] Templates de email customizados
- [X] Diversos bugs e melhorias de usabilidade

---

## Backlog (O que falta fazer)

### Utilitários
- [ ] Atualizar tabela de cargos após criação
- [ ] Revisar política de exclusão de cargos
- [ ] Corrigir deleção de cargo (passar id corretamente)

### Usuários
- [ ] Atualizar lista após inativar/ativar/alterar usuário
- [ ] Implementar paginação no fetch de usuários

### Parceiros
- [ ] Atualizar lista após inativar/ativar/alterar parceiro
- [ ] Corrigir campo de segmento na exportação Excel

### Contratos
- [X] Limite total de horas por membro na alocação
- [X] Garantir apenas 1 contrato AMS por parceiro
- [X] Liberação de horas no projeto (campo leitura + botão liberar)
- [ ] Criar tabela e trigger no supabase para alimentar log de liberação de horas do projeto
- [ ] Ajustar exportação para Excel
- [ ] Validar estrutura de pastas de arquivos
- [X] Campo status é agora editável durante o Editar em Detalhes
- [ ] Campo Parceiro não é mostrado corretamente nos Detalhes
- [ ] O campo status não é mostrado corretamente durante o dialog de Vincular Usuário
- [ ] Campo módulo do recurso não é mostrado corretamente no vínculo

### Chamados (Tickets)
- [ ] Tela de gestão de projetos na aba Gestão AMS
- [ ] Cards de melhorias com horas extrapoladas e horas faturáveis
- [ ] Tabela e detalhes de chamados (AMS)
- [ ] Trava de mensageria para recurso não alocado
- [ ] Qualificação de anexos
- [ ] Tipo de chamado: Atendimento Plantão

### Atividades
- [ ] Card de melhorias com horas extrapoladas totais
- [ ] Tabela e detalhes de projetos (TKEY/BShop)
- [ ] Detalhes de mensagem em atividades
- [ ] Incluir tarefa chave

### Timesheet/Timeflow
- [ ] Ajustar dashboards de projetos e chamados (incluir horas baseline, relatório de horas)
- [ ] Melhorias gerais

### Geral
- [ ] Encerrar sessão automaticamente após 1h (depende do plano Supabase)
- [ ] Revisar adição de roles
- [ ] Validações de registro
- [ ] Verificar visão do cliente nas abas

---

## Como rodar o projeto

1. Crie um projeto no Supabase ([dashboard](https://database.new))
2. Clone este repositório e instale as dependências
3. Renomeie `.env.example` para `.env.local` e preencha as variáveis do Supabase
4. Rode o servidor local:
   ```bash
   npm run dev
   ```
5. Acesse [localhost:3000](http://localhost:3000/)

Mais detalhes e exemplos de configuração estão no README original e na documentação do Supabase.

---

## Referências e Links Úteis

- [Demo online](https://demo-nextjs-with-supabase.vercel.app/)
- [Documentação Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Deploy na Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase)

---

> Para detalhes técnicos, exemplos de deploy e instruções avançadas, consulte a documentação do Supabase e os links acima.
