import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, Trash2, Ban, CheckCircle, Crown, Star, User2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminFetch, type AdminUser } from "@/lib/adminFetch";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

function PlanoBadge({ plano }: { plano: string }) {
  if (plano === "premium") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
      <Crown size={10} />Premium
    </span>
  );
  if (plano === "pro") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
      <Star size={10} />Pro
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <User2 size={10} />Grátis
    </span>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const searchTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(v: string) {
    setSearch(v);
    if (searchTimer[0]) clearTimeout(searchTimer[0]);
    const t = setTimeout(() => setDebouncedSearch(v), 400);
    searchTimer[1](t);
  }

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users", debouncedSearch],
    queryFn: async () => {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await adminFetch(`/api/admin/users${qs}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários");
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
      toast.success("Plano atualizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
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
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Erro ao alterar o status."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await adminFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir usuário");
    },
    onSuccess: () => {
      toast.success("Usuário excluído.");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir o usuário."),
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {users ? `${users.length} usuário${users.length !== 1 ? "s" : ""} encontrado${users.length !== 1 ? "s" : ""}` : "Carregando..."}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por e-mail..."
          className="pl-9"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : !users?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          {debouncedSearch ? `Nenhum usuário encontrado para "${debouncedSearch}".` : "Nenhum usuário cadastrado ainda."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Negócio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[180px]">{u.nomeCompleto ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email ?? u.userId}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <span className="truncate max-w-[140px] block">{u.nomeNegocio ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PlanoBadge plano={u.plano} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-medium ${u.statusAssinatura === "ativo" ? "text-green-600" : "text-red-500"}`}>
                      {u.statusAssinatura === "ativo" ? "Ativo" : "Suspenso"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Change plan */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Plano<ChevronDown size={12} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {["gratis", "pro", "premium"].map(p => (
                            <DropdownMenuItem
                              key={p}
                              disabled={u.plano === p || changePlanMutation.isPending}
                              onClick={() => changePlanMutation.mutate({ userId: u.userId, plano: p })}
                            >
                              {p === "premium" ? "Premium" : p === "pro" ? "Pro" : "Grátis"}
                              {u.plano === p && " ✓"}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Suspend / Reactivate */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={u.statusAssinatura === "ativo" ? "Suspender" : "Reativar"}
                        disabled={changeStatusMutation.isPending}
                        onClick={() =>
                          changeStatusMutation.mutate({
                            userId: u.userId,
                            status: u.statusAssinatura === "ativo" ? "cancelado" : "ativo",
                          })
                        }
                      >
                        {u.statusAssinatura === "ativo"
                          ? <Ban size={14} className="text-amber-600" />
                          : <CheckCircle size={14} className="text-green-600" />}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Excluir usuário"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o perfil e a assinatura de{" "}
              <strong>{deleteTarget?.email ?? deleteTarget?.nomeCompleto ?? deleteTarget?.userId}</strong>.
              {" "}Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.userId)}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
