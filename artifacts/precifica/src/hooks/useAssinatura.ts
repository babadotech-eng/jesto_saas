import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Assinatura {
  id: string;
  plano: string;
  planoEfetivo: string;
  status: string;
  valido_ate: string | null;
}

async function fetchAssinatura(): Promise<Assinatura> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;
  const res = await fetch("/api/assinaturas/current", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Erro ao buscar assinatura");
  const raw = await res.json() as Omit<Assinatura, "planoEfetivo">;
  return { ...raw, planoEfetivo: raw.status === "ativo" ? raw.plano : "gratis" };
}

export const ASSINATURA_QUERY_KEY = ["assinatura", "current"] as const;

export function useAssinatura() {
  return useQuery<Assinatura>({
    queryKey: ASSINATURA_QUERY_KEY,
    queryFn: fetchAssinatura,
    staleTime: 60_000,
  });
}
