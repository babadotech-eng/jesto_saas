import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Ban, CheckCircle, Crown, Star, User2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminFetch, type AdminAssinatura } from "@/lib/adminFetch";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

function PlanoBadge({ plano }: { plano: string }) {
  if (plano === "premium")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Crown size={10} />Premium</span>;
  if (plano === "pro")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"><Star size={10} />Pro</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"><User2 size={10} />Grátis</span>;
}

const PLANOS = ["Todos", "gratis", "pro", "premium"] as const;
const STATUS_OPTS = ["Todos", "ativo", "cancelado", "expirado"] as const;
const LABEL_PLANO: Record<string, string> = { gratis: "Grátis", pro: "Pro", premium: "Premium", Todos: "Todos os planos" };
const LABEL_STATUS: Record<string, string> = { ativo: "Ativo", cancelado: "Cancelado", expirado: "Expirado", Todos: "Todos os status" };

export default function AdminAssinaturas() {
  const qc = useQueryClient();
  const [planoFilter, setPlanoFilter] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  const qs = new URLSearchParams();
  if (planoFilter !== "Todos") qs.set("plano", planoFilter);
  if (statusFilter !== "Todos") qs.set("status", statusFilter);

  const { data, isLoading } = useQuery<AdminAssinatura[]>({
    queryKey: ["admin", "assinaturas", planoFilter, statusFilter],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/assinaturas?${qs.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar assinaturas");
      return res.json();
    },
    staleTime: 30_000,
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, plano }: { userId: string; plano: string }) => {
      const res = await adminFetch(`/api/admin/users/${userId}/plano`, {
        method: "PUT",
        body: JSON.stringify({ plano }),
      });
      if (!res.ok) throw new Error("Erro ao alterar plano");
    },
    onSuccess: () => {
      toast.success("Plano atualizado!");
      qc.invalidateQueries({ queryKey: ["admin", "assinaturas"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: () => toast.error("Erro ao alterar o plano."),
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const res = await adminFetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      qc.invalidateQueries({ queryKey: ["admin", "assinaturas"] });
    },
    onError: () => toast.error("Erro ao alterar o status."),
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Assinaturas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.length} registro${data.length !== 1 ? "s" : ""} encontrado${data.length !== 1 ? "s" : ""}` : "Carregando..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Plano: {LABEL_PLANO[planoFilter] ?? planoFilter} <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {PLANOS.map(p => (
              <DropdownMenuItem key={p} onClick={() => setPlanoFilter(p)} className={planoFilter === p ? "font-medium" : ""}>
                {LABEL_PLANO[p] ?? p}{planoFilter === p ? " ✓" : ""}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Status: {LABEL_STATUS[statusFilter] ?? statusFilter} <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {STATUS_OPTS.map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? "font-medium" : ""}>
                {LABEL_STATUS[s] ?? s}{statusFilter === s ? " ✓" : ""}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(planoFilter !== "Todos" || statusFilter !== "Todos") && (
          <Button variant="ghost" size="sm" onClick={() => { setPlanoFilter("Todos"); setStatusFilter("Todos"); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          Nenhuma assinatura encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Início</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Válido Até</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(row => (
                <tr key={row.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[180px]">{row.nomeCompleto ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.email ?? row.userId}</p>
                  </td>
                  <td className="px-4 py-3"><PlanoBadge plano={row.plano} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium ${row.status === "ativo" ? "text-green-600" : row.status === "cancelado" ? "text-red-500" : "text-yellow-600"}`}>
                      {row.status === "ativo" ? "Ativo" : row.status === "cancelado" ? "Cancelado" : "Expirado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmtDate(row.validoAte)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Plano <ChevronDown size={12} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {["gratis", "pro", "premium"].map(p => (
                            <DropdownMenuItem
                              key={p}
                              disabled={row.plano === p || changePlanMutation.isPending}
                              onClick={() => changePlanMutation.mutate({ userId: row.userId, plano: p })}
                            >
                              {p === "premium" ? "Premium" : p === "pro" ? "Pro" : "Grátis"}
                              {row.plano === p && " ✓"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={row.status === "ativo" ? "Cancelar" : "Reativar"}
                        disabled={changeStatusMutation.isPending}
                        onClick={() => changeStatusMutation.mutate({
                          userId: row.userId,
                          status: row.status === "ativo" ? "cancelado" : "ativo",
                        })}
                      >
                        {row.status === "ativo"
                          ? <Ban size={14} className="text-amber-600" />
                          : <CheckCircle size={14} className="text-green-600" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
