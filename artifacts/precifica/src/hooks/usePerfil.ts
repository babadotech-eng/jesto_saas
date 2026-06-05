import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Perfil {
  id: string;
  user_id: string;
  nome_completo: string | null;
  nome_negocio: string | null;
  tipo_negocio: string | null;
  volume_mensal: string | null;
  cidade_estado: string | null;
  whatsapp: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  origem: string | null;
  logo_url: string | null;
  deleted_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export class PerfilError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PerfilError";
    this.status = status;
  }
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
  if (!res.ok) throw new PerfilError("Erro ao buscar perfil", res.status);
  return res.json();
}

async function updatePerfil(data: Partial<Omit<Perfil, "id" | "user_id" | "created_at" | "updated_at" | "deleted_at" | "expires_at">>): Promise<Perfil> {
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
  return useQuery<Perfil, PerfilError>({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: fetchPerfil,
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof PerfilError && error.status === 410) return false;
      return failureCount < 1;
    },
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
