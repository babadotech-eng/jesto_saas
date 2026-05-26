export const PLAN_LIMITS = {
  gratis:  { produtos: 5,        insumos: 15,       fichas: 5,        despesas: 20       },
  pro:     { produtos: 100,      insumos: 200,       fichas: 100,      despesas: 200      },
  premium: { produtos: Infinity, insumos: Infinity,  fichas: Infinity, despesas: Infinity },
} as const;

export const PLAN_FEATURES = {
  gratis:  { excelImportExport: false, funcionarios: false, autoLaborCost: false },
  pro:     { excelImportExport: true,  funcionarios: false, autoLaborCost: false },
  premium: { excelImportExport: true,  funcionarios: true,  autoLaborCost: true  },
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
