import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Perfil {
  id: string;
  user_id: string;
  nome_completo: string | null;
  nome_negocio: string | null;
  tipo_negocio: string | null;
  cidade_estado: string | null;
  whatsapp: string | null;
  origem: string | null;
  created_at: string;
  updated_at: string;
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function fetchPerfil(): Promise<Perfil> {
  const token = await getToken();
  const res = await fetch("/api/perfis/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erro ao buscar perfil");
  return res.json();
}

async function updatePerfil(data: Partial<Omit<Perfil, "id" | "user_id" | "created_at" | "updated_at">>): Promise<Perfil> {
  const token = await getToken();
  const res = await fetch("/api/perfis/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar perfil");
  return res.json();
}

export const PERFIL_QUERY_KEY = ["perfil", "me"] as const;

export function usePerfil(enabled = true) {
  return useQuery<Perfil>({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: fetchPerfil,
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdatePerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePerfil,
    onSuccess: (data) => {
      qc.setQueryData(PERFIL_QUERY_KEY, data);
    },
  });
}
