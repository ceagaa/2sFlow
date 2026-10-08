# 2sFlow

O 2sFlow é um gerenciador de tarefas com quadro Kanban feito para organizar o dia a dia de trabalho: você cria workspaces, divide em projetos e move tarefas entre colunas até tudo ficar concluído. Interface toda em português, tema escuro e rápido de usar.

## O que dá pra fazer

- **Workspaces** — crie quantos quiser (um por cliente, time ou área) e troque entre eles pelo seletor da barra lateral.
- **Projetos** — dentro de cada workspace, organize os projetos, renomeie, exclua e reordene arrastando.
- **Kanban ou Lista** — visualize as tarefas no quadro arrastável ou numa lista compacta com edição rápida de status, prioridade e data de entrega.
- **Colunas sob medida** — cada projeto pode ter seus próprios status (A fazer, Em andamento, Em revisão, Concluído, ou o que você quiser), com modelos reutilizáveis.
- **Tarefas e subtarefas** — prioridade, descrição, data de entrega e subtarefas com progresso.
- **Login e nuvem** — com Supabase configurado, seus dados ficam na conta de cada usuário, com RLS protegendo tudo. Sem Supabase, o app roda 100% local no navegador (localStorage).
- **Funciona offline** — se a conexão cair, as alterações continuam salvas localmente e sincronizam sozinhas quando a rede voltar.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS |
| Estado | Zustand (persistido no localStorage) |
| Arrastar e soltar | dnd-kit |
| Backend/Auth | Supabase (opcional) |

## Rodando o projeto

```bash
npm install
npm run dev
```

Para gerar o build de produção:

```bash
npm run build
npm run preview
```

## Configuração (opcional)

O app funciona sem nenhuma configuração — só rode `npm run dev` e use em modo local.

Para ativar a sincronização com a nuvem:

1. Copie `.env.example` para `.env` e preencha:

   ```
   VITE_SUPABASE_URL=sua_url
   VITE_SUPABASE_ANON_KEY=sua_chave_anon
   ```

   > Só a chave pública (anon) pode ir no frontend. Nunca use a `service_role` aqui.

2. Rode o script `supabase/schema.sql` no SQL Editor do seu projeto Supabase. Ele cria as tabelas e as políticas de RLS (cada usuário só enxerga os próprios dados).

3. Reinicie o dev server.

## Estrutura do código

```
src/
├── components/
│   ├── layout/        # AppLayout, Sidebar, Header
│   └── ui/            # Button, Dialog, Input, Dropdown, Badge
├── features/
│   ├── auth/          # Login/cadastro e guarda de sessão
│   ├── workspaces/    # Seletor e store de workspaces
│   ├── projects/      # Projetos, status e modelos de status
│   └── kanban/        # Quadro, lista, tarefas, drag & drop
├── lib/               # Cliente Supabase, sincronização e utilitários
└── App.tsx            # Composição da tela principal
```

A ideia é simples: cada feature cuida do seu estado (store), componentes e regras, e o `lib/` concentra a integração com o Supabase.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Compila TypeScript e gera o build |
| `npm run preview` | Visualiza o build de produção |
