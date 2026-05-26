---
name: Fracionamento FichaTecnica
description: Seletor de unidade ao adicionar ingrediente — conversão client-side antes de salvar na unidade nativa do insumo.
---

# Regra
Em `FichaDetail` (FichaTecnica.tsx), o seletor de unidade filtra opções baseado na unidade nativa do insumo via `UNIDADES_FRACAO`. A conversão ocorre em `convertToNativeUnit()` antes de chamar `addItemMutation` — o banco sempre armazena na unidade nativa.

**Why:** sem schema change; custo estimado exibido em tempo real com a conversão aplicada.

**How to apply:**
- `UNIDADES_FRACAO`: kg/g → [g,kg]; L/ml → [ml,L]; un/dz → [un,dz]; outros → só a própria unidade.
- Reset de `addUnit` ao trocar insumo (via `handleInsumoChange`).
- NovaFichaForm não tem fracionamento — usa quantidade direta (unidade nativa apenas).
