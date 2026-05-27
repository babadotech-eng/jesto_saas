import { supabase } from "@/lib/supabase";

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export interface AdminStats {
  totalUsuarios: number;
  porPlano: { gratis: number; pro: number; premium: number };
  assinaturasAtivas: number;
  novosMes: number;
  atividades: Array<{
    userId: string;
    plano: string;
    status: string;
    updatedAt: string | null;
    email: string | null;
    nomeCompleto: string | null;
  }>;
}

export interface AdminUser {
  userId: string;
  email: string | null;
  nomeCompleto: string | null;
  nomeNegocio: string | null;
  createdAt: string;
  plano: string;
  statusAssinatura: string;
  planoUpdatedAt: string | null;
}

export interface AdminUserDetail {
  userId: string;
  id: string;
  email: string | null;
  nomeCompleto: string | null;
  nomeNegocio: string | null;
  tipoNegocio: string | null;
  volumeMensal: string | null;
  cidadeEstado: string | null;
  whatsapp: string | null;
  origem: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  plano: string;
  statusAssinatura: string;
  planoUpdatedAt: string | null;
  validoAte: string | null;
}

export interface AdminAssinatura {
  userId: string;
  email: string | null;
  nomeCompleto: string | null;
  plano: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  validoAte: string | null;
}

export interface AdminFinanceiro {
  mrrAtual: number;
  receitaPorPlano: {
    pro: { count: number; receita: number };
    premium: { count: number; receita: number };
  };
  mrrMensal: Array<{ mes: string; mesLabel: string; receita: number }>;
  historico: Array<{
    userId: string;
    email: string | null;
    nomeCompleto: string | null;
    plano: string;
    status: string;
    createdAt: string;
    valor: number;
  }>;
}

export interface AdminCodigo {
  id: string;
  codigo: string;
  tipo: "percentual" | "fixo";
  desconto: string;
  dataInicio: string;
  dataExpiracao: string | null;
  limiteUsos: number | null;
  usosAtuais: number;
  ativo: boolean;
  createdAt: string;
}
