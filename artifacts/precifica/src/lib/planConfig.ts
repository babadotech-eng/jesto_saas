export const PLAN_LIMITS = {
  gratis:  { produtos: 5,        insumos: 30,       fichas: 10       },
  pro:     { produtos: Infinity, insumos: Infinity,  fichas: Infinity },
  premium: { produtos: Infinity, insumos: Infinity,  fichas: Infinity },
} as const;

export const PLAN_FEATURES = {
  gratis: {
    dashboardCustos:     false,
    alertasMargem:       false,
    despesasFixas:       false,
    fluxoCaixa:          false,
    pontoEquilibrio:     false,
    relatoriosAvancados: false,
    margemReal:          false,
    funcionarios:        false,
    excelImportExport:   false,
    autoLaborCost:       false,
  },
  pro: {
    dashboardCustos:     true,
    alertasMargem:       true,
    despesasFixas:       false,
    fluxoCaixa:          false,
    pontoEquilibrio:     false,
    relatoriosAvancados: false,
    margemReal:          true,
    funcionarios:        false,
    excelImportExport:   true,
    autoLaborCost:       false,
  },
  premium: {
    dashboardCustos:     true,
    alertasMargem:       true,
    despesasFixas:       true,
    fluxoCaixa:          true,
    pontoEquilibrio:     true,
    relatoriosAvancados: true,
    margemReal:          true,
    funcionarios:        true,
    excelImportExport:   true,
    autoLaborCost:       true,
  },
} as const;

type PlanoKey = keyof typeof PLAN_LIMITS;

function resolve(plano: string): PlanoKey {
  return (plano in PLAN_LIMITS ? plano : "gratis") as PlanoKey;
}

export function getLimites(plano: string) {
  return PLAN_LIMITS[resolve(plano)];
}

export function getFeatures(plano: string) {
  return PLAN_FEATURES[resolve(plano)];
}

export function nomePlano(plano: string): string {
  if (plano === "premium") return "Premium";
  if (plano === "pro") return "Pro";
  return "Grátis";
}

const PLAN_ORDER = ["gratis", "pro", "premium"] as const;

export function planAtLeast(userPlano: string, minPlano: PlanoKey): boolean {
  const idx = PLAN_ORDER.indexOf(resolve(userPlano));
  const min = PLAN_ORDER.indexOf(minPlano);
  return idx >= min;
}
