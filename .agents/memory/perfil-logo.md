---
name: Perfil logo_url
description: Coluna logo_url na tabela perfis — upload via Supabase Storage, bucket público "logos".
---

# Regra
A tabela `perfis` tem coluna `logo_url TEXT NULL` (adicionada via drizzle push). O campo é persistido pela rota `PUT /api/perfis/me` e retornado pelo `GET /api/perfis/me`.

**Why:** upload de logo do negócio pedido pelo usuário; exibição no Painel "Resultado do Mês".

**How to apply:**
- O bucket Supabase Storage `logos` deve existir e ser **público** — não é criado automaticamente pelo código.
- Upload path: `${userId}/logo.${ext}` com upsert=true.
- Configuracoes.tsx exibe instruções passo a passo na página caso o bucket não exista.
- usePerfil.ts tem `logo_url: string | null` no tipo `Perfil`.
