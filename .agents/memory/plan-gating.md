---
name: Plan gating architecture
description: How plan-based access control (gratis/pro/premium) is implemented across the app.
---

## Rule
All plan limits and feature flags come from `artifacts/precifica/src/lib/planConfig.ts` — never hardcode limits in individual pages.

**Why:** Centralizing into `PLAN_LIMITS` / `PLAN_FEATURES` makes it easy to update limits without hunting down every page. Also provides `planAtLeast(userPlano, minPlano)` helper for ordering checks.

## How to apply
- Call `getLimites(assinatura?.plano ?? "gratis")` or `getFeatures(assinatura?.plano ?? "gratis")` in gated components.
- Use `planAtLeast(plano, "pro"|"premium")` for min-plan comparisons.
- For full-page gates: call `useAssinatura()` with `isLoading`, then return a Crown locked state only after `!isLoading` to avoid flash.
- Use `<UpgradeModal>` for limit dialogs; use inline Crown locked state for full-page gates.
- Backend: use `requirePlan("pro"|"premium")` middleware (from `auth.ts`) after `requireAuth`.

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

## Frontend full-page gates
- Painel → Pro (dashboardCustos)
- Lançamentos → Premium (fluxoCaixa)
- Relatórios → Premium (planAtLeast "premium")
- Funcionários → Premium (existing)

## Sidebar (Layout.tsx)
Nav items use `minPlan: "premium"` field; filter uses `planAtLeast`. Items hidden for users below minPlan: Lançamentos, Funcionários, Relatórios.
