# Precifica

Micro-SaaS de precificação e gestão financeira para pequenos negócios de alimentação (marmitas, bolos, salgados). Todo o texto em português, moeda em BRL.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — servidor API (porta 8080)
- `pnpm --filter @workspace/precifica run dev` — frontend React/Vite (porta 19689)
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenera hooks e schemas Zod do OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplica mudanças no schema do DB (apenas dev)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + TailwindCSS 4, shadcn/ui, wouter (routing), react-query, recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Supabase Auth (JWT) — frontend usa SDK Supabase; backend valida Bearer token via `supabase.auth.getUser()`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/precifica/src/` — frontend React
  - `pages/` — Dashboard, Produtos, Insumos, FichaTecnica, Despesas, Lancamentos, Relatorios, Configuracoes, Landing, Login, Cadastro, Planos
  - `components/Layout.tsx` — sidebar navigation
  - `contexts/AuthContext.tsx` — Supabase session context
  - `lib/supabase.ts` — Supabase client (strips /rest/v1/ from URL)
- `artifacts/api-server/src/routes/` — Express routes (produtos, insumos, fichas, despesas, lancamentos, relatorios, assinaturas)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `lib/db/src/schema/` — Drizzle ORM schemas (produtos, insumos, fichas_tecnicas, ficha_itens, despesas_fixas, lancamentos)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — gerado pelo Orval (hooks React Query)
- `lib/api-zod/src/generated/api.ts` — gerado pelo Orval (schemas Zod)

## Architecture decisions

- Supabase Auth para autenticação: frontend usa `supabase.auth.signIn*`, backend valida JWTs com `supabase.auth.getUser(token)` — sem sessões server-side
- Contract-first API: OpenAPI spec → Orval gera React Query hooks e Zod schemas; rotas Express usam os Zod schemas para validação
- `VITE_SUPABASE_URL` pode incluir path `/rest/v1/` — o cliente (`lib/supabase.ts`) extrai somente a origin via `new URL(rawUrl).origin`
- Todas as tabelas têm coluna `user_id` para isolamento multi-tenant; o middleware injeta `userId` no request
- Campos numéricos no Drizzle são `numeric` (string) — converter com `Number()` nas rotas

## Product

- **Landing** — apresentação do produto com hero, features, CTA
- **Auth** — login e cadastro via Supabase (email/senha)
- **Dashboard** — KPIs (receita, custos, margem média, resultado), fluxo semanal (Recharts), ponto de equilíbrio, top produtos por margem, alertas de margem baixa
- **Produtos** — CRUD com precificação completa (preço venda, mão de obra, frete, impostos, taxas, comissões), cálculo de margem em tempo real
- **Insumos** — CRUD de ingredientes/matérias-primas com fator de correção
- **Fichas Técnicas** — receitas vinculadas a produtos; adicionar/remover ingredientes; cálculo automático de CMV
- **Despesas Fixas** — CRUD de custos fixos mensais
- **Lançamentos** — fluxo de caixa (receitas e despesas com data); filtros por tipo; resumo de saldo
- **Relatórios** — fluxo semanal, ponto de equilíbrio detalhado, ranking de produtos por margem, alertas
- **Configurações** — perfil do usuário e plano atual

## User preferences

- Toda interface em português do Brasil
- Moeda em BRL (R$)
- Tema amber/dark com Inter font

## Gotchas

- `VITE_SUPABASE_URL` secret pode vir com `/rest/v1/` — o `lib/supabase.ts` trata isso automaticamente
- Não rodar `pnpm dev` na raiz — usar `restart_workflow` ou os comandos com `--filter`
- Campos `numeric` no Drizzle são strings — sempre converter com `Number()` antes de retornar na API
- O `setAuthTokenGetter` em `App.tsx` injeta o JWT do Supabase em todas as chamadas da API client

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
