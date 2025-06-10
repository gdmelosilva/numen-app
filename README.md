Feitos:
- [X] Adicionar verificaçao de role e client na sidebar para exibir:
      (admin e cliente) == Nao <Admin - Parceiros e Contratos> e <Utilitarios> e <TimeSheet> e <TimeFlow>
      (gerente e cliente) == Nao <Admin> e <Utilitarios> e <TimeSheet> e <TimeFlow>
      (resource e cliente) == Nao <Admin> e <Utilitarios> e <TimeSheet> e <TimeFlow> // Além disso não pode abrir chamado - só responder.
- [X] Validação da Senha (caracteres mínimos pelo menos)
- [X] Ajustes de Mensagens de Erro para Portugues
- [X] Geral - Entender porque a barra de rolagem está rodando a pagina com a sidebar (quando a sidebar deveria ser fixa) - Criado um Provider
- [X] Adicionar Usuário na Sidebar
- [X] Incluir Coluna Parceiro
- [X] Alterar Funcionário para Funcional
- [X] Ativar função "Editar"
- [X] Remover função "Duplicar"
- [X] Ativar função "Excluir" e renomear para "Inativar" (marcar como inativo)
- [X] Criar função "Ativar" (marcar como ativo)
- [X] Finalizar inserção de filtros (incluir todos)
- [X] Finalizar inserção de filtros (parceiro) (TESTAR)
- [X] Remover filtro parceiro
- [X] Quando o cliente criar um user deve ir para o parceiro dele automaticamente
- [X] Não aparecer campo selecionar parceiro para o Admin Cliente
- [X] Criar Página Parceiros
- [X] Criar Tabela Parceiros
- [X] Criar GET Parceiros
- [X] Criar POST Parceiros
- [X] Ativar função "Editar"
- [X] Remover função "Duplicar"
- [X] Ativar função "Excluir" e renomear para "Inativar" (marcar como inativo)
- [X] Criar função "Ativar" (marcar como ativo)
- [X] Criar função "Detalhes" (acessar pagina de detalhes)
- [X] Finalizar inserção de filtros (incluir todos)
- [X] Ajustar filtro de Segmento
- [X] Ajustar select de Segmento
- [X] Fazer campo de filtro BUSCAR funcionar para só o nome do usuário
- [X] Botão limpar todos os filtros
- [X] Limitar first_name para somente uma palavra (não pode espaço e mais de 40 caracteres)

Vai ficar pra ver com o Felipe:
- [ ] Encerrar a Sessão automáticamente com 1h de uso (Supabase // Precisamos do plano Pro)
- [ ] Verificar a adicao de roles

Backlog geral:
- [ ] Tirar texto "numen" do arquivo svg e manter a proporção quadradinha

Backlog Utilitarios: **Deixar por ultimo!
- [ ] Cargos - Depois de criar, atualizar tabela (adicionar Fetch)
- [ ] Cargos - Verificar Politica de Delete (cacete do caralho)
- [ ] Ajustar Deletar Cargo - Atualmente não está passando o id corretamente

Backlog Users: (Finalizado!)
- [ ] Fetch após inativar / ativar / alterar *
- [ ] Fetch dividido (para paginação) *

Backlog Parceiros:
- [X] Remover filtro Buscar
- [X] Alterar ID Externo por Id.Parceiro
- [X] Alterar Descrição por Nome
- [X] Ajustar selects de Comp.Adm. e Ativo
- [X] Ajustar campos na criação (limite de caracteres e formatação)
- [X] Ajustar campo identificação na tabela (se 14 char = 00.000.000/0000-00 se menos = 000.000.000-00)
- [X] Ajustar campo telefone na tabela (sempre 8 ou 9 caracteres formato ddd+telefone)
- [X] Criar botão "Exportar Excel"
- [X] Incluir campos de endereço nos detalhes do parceiro (colocar um divisor e os campos abaixo)
- [X] Corrigir filtro de usuários por parceiro (ta trazendo todo mundo carai)
- [ ] Fetch após inativar / ativar / alterar
- [ ] Consertar o campo de Segmento no exportar Excel
- [ ] Adicionar botões de Vincular / Desvincular usuário ao parceiro

Backlog Contratos: (pegar referencia no projeto antigo)
- [X] Alterar PROJETOS para CONTRATOS
- [X] Ajustar filtro id parceiro para trazer o select da api
- [X] Ajustar filtro tipo de projeto para trazer o select do enum
- [X] Ajustar filtro status de projeto para trazer o select da tabela
- [X] Ajustar Coluna Tipo de Projeto para trazer a Badge conforme enum (AMS, Bodyshop ou Turnkey)
- [X] Ajustar Coluna booleana para ter uma badge de sim / não
- [ ] Criar detalhes do projeto (com informações do projeto, recursos alocados, se for AMS - Tickets relacionados, se não, Atividades Relacionadas)...
- [ ] Criar funções: Alocar Recurso, Editar Projeto (dados do projeto + campos adicionais), 

Backlog Administrar Chamados:
- [ ] Criar página para exibir tabela de chamados (projeto ams) - Lembrar da visibilidade para o usuário client
- [ ] Criar detalhes do chamado (usar tela referencia antiga / detalhes + mensagens)
- [ ] Criar detalhes de mensagem (usar tela referencia antiga / detalhes + mensagens)

Backlog Gestão Atividades:
- [ ] Criar página para exibir tabela de projetos (projeto tkey / bshop) - Lembrar da visibilidade para o usuário client
- [ ] Criar detalhes do projeto (dashboard com informações do projeto, recursos alocados, se for AMS - Tickets relacionados, se não, Atividades Relacionadas)...
- [ ] Criar detalhes da atividade (usar tela referencia antiga / detalhes + mensagens)
- [ ] Criar detalhes de mensagem (lembrar que atividade nao tem mensagem para o cliente)

Backlog Timesheet:
  Se Deus quiser
Backlog Timeflow:
  Se Deus quiser

<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
