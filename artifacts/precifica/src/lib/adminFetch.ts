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
