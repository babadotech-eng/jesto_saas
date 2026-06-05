---
name: Plan gating architecture
description: How plan-based access control (gratis/pro/premium) is implemented across the app.
---

## Rule
All plan limits and feature flags come from `artifacts/precifica/src/lib/planConfig.ts` — never hardcode limits in individual pages.

**Why:** Centralizing into `PLAN_LIMITS` / `PLAN_FEATURES` + `planAtLeast()` makes limits easy to update and keeps frontend/backend aligned.

## How to apply
- Call `getLimites(assinatura?.plano ?? "gratis")` or `getFeatures(assinatura?.plano ?? "gratis")` in gated components.
- Use `planAtLeast(plano, "pro"|"premium")` for min-plan comparisons.
- For full-page gates: call `useAssinatura()` with `isLoading`, then return a Crown locked state only after `!isLoading` to avoid flash.
- Use `<UpgradeModal>` for limit dialogs; use inline Crown locked state for full-page gates.
- For pages with mixed Pro/Premium sections: use both `isPro` and `isPremium` booleans. Gate the page itself on `isPro`, then gate individual Premium sections with `<PremiumLock>`.
- Backend: use `requirePlan("pro"|"premium")` middleware (from `auth.ts`) after `requireAuth`.

## Key invariant
**Never block in the frontend something the backend allows for that plan, and never display something the backend will reject.**
Frontend gate level must exactly match backend gate level per section/endpoint.

## Current limits
| Plan    | Produtos | Insumos | Fichas |
|---------|----------|---------|--------|
| gratis  | 5        | 30      | 10     |
| pro     | ∞        | ∞       | ∞      |
| premium | ∞        | ∞       | ∞      |

Despesas fixas removed from PLAN_LIMITS — now feature-gated (Premium only), not count-gated.

## Feature flags (PLAN_FEATURES)
| Feature             | gratis | pro   | premium |
|---------------------|--------|-------|---------|
| dashboardCustos     | false  | true  | true    |
| alertasMargem       | false  | true  | true    |
| margemReal          | false  | true  | true    |
| excelImportExport   | false  | true  | true    |
| despesasFixas       | false  | false | true    |
| fluxoCaixa          | false  | false | true    |
| pontoEquilibrio     | false  | false | true    |
| relatoriosAvancados | false  | false | true    |
| funcionarios        | false  | false | true    |
| autoLaborCost       | false  | false | true    |

## Backend plan guards (routes)
- `/api/despesas/*` → Premium
- `/api/lancamentos/*` → Premium
- `/api/relatorios/dashboard` → Pro
- `/api/relatorios/top-produtos` → Pro
- `/api/relatorios/alertas-margem` → Pro
- `/api/relatorios/fluxo-semanal` → Premium
- `/api/relatorios/ponto-equilibrio` → Premium

## Frontend gates per page

### Painel → Pro full-page lock (dashboardCustos)
### Lançamentos → Premium full-page lock (fluxoCaixa)
### Relatórios → Pro full-page lock; within page:
  - top-produtos: visible (Pro+)
  - alertas-margem: visible (Pro+)
  - fluxo-semanal: PremiumLock for non-Premium
  - ponto-equilibrio: PremiumLock for non-Premium
  - relatórios avançados: PremiumLock for non-Premium
### Funcionários → Premium full-page lock

## Sidebar (Layout.tsx)
Nav items use `minPlan: "pro"|"premium"` field; filter uses `planAtLeast`.
- Lançamentos: minPlan "premium"
- Funcionários: minPlan "premium"
- Relatórios: minPlan "pro" (Pro users see the nav item)
