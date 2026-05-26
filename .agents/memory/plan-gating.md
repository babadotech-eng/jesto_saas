---
name: Plan gating architecture
description: How plan-based access control (gratis/pro/premium) is implemented across the app.
---

## Rule
All plan limits and feature flags come from `artifacts/precifica/src/lib/planConfig.ts` — never hardcode limits in individual pages.

**Why:** Previously limits were scattered (LIMITE_FICHAS_GRATIS=1, LIMITE_INSUMOS_GRATIS=10 as page-level constants). Centralizing into `PLAN_LIMITS` / `PLAN_FEATURES` makes it easy to update limits without hunting down every page.

## How to apply
- Call `getLimites(assinatura?.plano ?? "gratis")` and `getFeatures(assinatura?.plano ?? "gratis")` at the top of each gated component.
- Use `<UpgradeModal>` (from `src/components/UpgradeModal.tsx`) for all limit/feature lock dialogs — it handles navigation to `/planos` internally.
- DB schema (`lib/db/src/schema/assinaturas.ts`): plano enum = `["gratis", "pro", "premium"]`.

## Current limits (as of this implementation)
| Plan    | Produtos | Insumos | Fichas | Despesas |
|---------|----------|---------|--------|----------|
| gratis  | 5        | 15      | 5      | 20       |
| pro     | 100      | 200     | 100    | 200      |
| premium | ∞        | ∞       | ∞      | ∞        |

## Feature flags
| Feature          | gratis | pro | premium |
|------------------|--------|-----|---------|
| excelImportExport | false | true | true  |
| funcionarios     | false  | false | true  |
| autoLaborCost    | false  | false | true  |
