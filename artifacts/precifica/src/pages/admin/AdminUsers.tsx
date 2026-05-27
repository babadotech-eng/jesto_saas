import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, ChevronDown, Trash2, Ban, CheckCircle, Crown, Star,
  User2, KeyRound, Building2, Phone, MapPin, Package, Calendar,
} from "lucide-react";
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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { adminFetch, type AdminUser, type AdminUserDetail } from "@/lib/adminFetch";

function fmtDate(d: string | null | undefined) {
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

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value || "—"}</p>
    </div>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; email: string | null; nomeCompleto: string | null } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<{ userId: string; email: string | null } | null>(null);
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

  const { data: userDetail, isLoading: detailLoading } = useQuery<AdminUserDetail>({
    queryKey: ["admin", "user-detail", selectedUserId],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/users/${selectedUserId}`);
      if (!res.ok) throw new Error("Erro ao buscar detalhes");
      return res.json();
    },
    enabled: !!selectedUserId,
    staleTime: 60_000,
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
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "user-detail", selectedUserId] });
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
      qc.invalidateQueries({ queryKey: ["admin", "user-detail", selectedUserId] });
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
      setSelectedUserId(null);
    },
    onError: () => toast.error("Erro ao excluir o usuário."),
  });

  const resetSenhaMutation = useMutation({
    mutationFn: async (userId: string) => {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const res = await adminFetch(`/api/admin/users/${userId}/reset-senha`, {
        method: "POST",
        body: JSON.stringify({ redirectTo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao enviar e-mail");
      }
      return res.json() as Promise<{ ok: boolean; email: string }>;
    },
    onSuccess: (data) => {
      toast.success(`E-mail de redefinição enviado para ${data.email}.`);
      setResetTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {users
            ? `${users.length} usuário${users.length !== 1 ? "s" : ""} encontrado${users.length !== 1 ? "s" : ""}`
            : "Carregando..."}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
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
                    <button
                      onClick={() => setSelectedUserId(u.userId)}
                      className="text-left group"
                    >
                      <p className="font-medium truncate max-w-[180px] group-hover:text-amber-600 transition-colors underline-offset-2 group-hover:underline">
                        {u.nomeCompleto ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email ?? u.userId}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <span className="truncate max-w-[140px] block">{u.nomeNegocio ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3"><PlanoBadge plano={u.plano} /></td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-medium ${u.statusAssinatura === "ativo" ? "text-green-600" : "text-red-500"}`}>
                      {u.statusAssinatura === "ativo" ? "Ativo" : "Suspenso"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
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

                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title={u.statusAssinatura === "ativo" ? "Suspender" : "Reativar"}
                        disabled={changeStatusMutation.isPending}
                        onClick={() => changeStatusMutation.mutate({
                          userId: u.userId,
                          status: u.statusAssinatura === "ativo" ? "cancelado" : "ativo",
                        })}
                      >
                        {u.statusAssinatura === "ativo"
                          ? <Ban size={14} className="text-amber-600" />
                          : <CheckCircle size={14} className="text-green-600" />}
                      </Button>

                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Excluir usuário"
                        onClick={() => setDeleteTarget({ userId: u.userId, email: u.email, nomeCompleto: u.nomeCompleto })}
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

      {/* ── User Detail Sheet ── */}
      <Sheet open={!!selectedUserId} onOpenChange={open => { if (!open) setSelectedUserId(null); }}>
        <SheetContent className="w-full sm:w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle className="text-lg truncate">
              {detailLoading ? "Carregando..." : (userDetail?.nomeCompleto ?? userDetail?.email ?? "Usuário")}
            </SheetTitle>
            <SheetDescription className="text-xs truncate">
              {userDetail?.email ?? ""}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
            </div>
          ) : userDetail ? (
            <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

              {/* Perfil */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perfil</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label="Nome Completo" value={userDetail.nomeCompleto} />
                  <DetailField label="E-mail" value={userDetail.email} />
                </div>
              </section>

              {/* Negócio */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} />Negócio
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label="Nome do Negócio" value={userDetail.nomeNegocio} />
                  <DetailField label="Tipo de Negócio" value={userDetail.tipoNegocio} />
                  <DetailField label="Volume Mensal" value={userDetail.volumeMensal} />
                  <DetailField label="Origem" value={userDetail.origem} />
                </div>
              </section>

              {/* Contato */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={12} />Contato
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin size={12} className="text-muted-foreground mt-1 shrink-0" />
                    <DetailField label="Cidade / Estado" value={userDetail.cidadeEstado} />
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Phone size={12} className="text-muted-foreground mt-1 shrink-0" />
                    <DetailField label="WhatsApp" value={userDetail.whatsapp} />
                  </div>
                </div>
              </section>

              {/* Assinatura */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={12} />Assinatura
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <PlanoBadge plano={userDetail.plano} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`text-sm font-medium ${userDetail.statusAssinatura === "ativo" ? "text-green-600" : "text-red-500"}`}>
                      {userDetail.statusAssinatura === "ativo" ? "Ativo" : "Suspenso"}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar size={12} className="text-muted-foreground mt-1 shrink-0" />
                    <DetailField label="Cadastrado em" value={fmtDate(userDetail.createdAt)} />
                  </div>
                  {userDetail.planoUpdatedAt && (
                    <DetailField label="Plano atualizado em" value={fmtDate(userDetail.planoUpdatedAt)} />
                  )}
                </div>
              </section>

              {/* Ações */}
              <section className="border-t border-border pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</h3>

                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Alterar Plano <ChevronDown size={13} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {["gratis", "pro", "premium"].map(p => (
                        <DropdownMenuItem
                          key={p}
                          disabled={userDetail.plano === p || changePlanMutation.isPending}
                          onClick={() => changePlanMutation.mutate({ userId: userDetail.userId, plano: p })}
                        >
                          {p === "premium" ? "Premium" : p === "pro" ? "Pro" : "Grátis"}
                          {userDetail.plano === p && " ✓"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline" size="sm"
                    disabled={changeStatusMutation.isPending}
                    onClick={() => changeStatusMutation.mutate({
                      userId: userDetail.userId,
                      status: userDetail.statusAssinatura === "ativo" ? "cancelado" : "ativo",
                    })}
                  >
                    {userDetail.statusAssinatura === "ativo"
                      ? <><Ban size={13} className="mr-1.5 text-amber-600" />Suspender</>
                      : <><CheckCircle size={13} className="mr-1.5 text-green-600" />Reativar</>}
                  </Button>
                </div>

                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                  onClick={() => setResetTarget({ userId: userDetail.userId, email: userDetail.email })}
                >
                  <KeyRound size={13} />
                  Redefinir Senha
                </Button>

                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 w-full sm:w-auto"
                  onClick={() => setDeleteTarget({ userId: userDetail.userId, email: userDetail.email, nomeCompleto: userDetail.nomeCompleto })}
                >
                  <Trash2 size={13} />
                  Excluir Usuário
                </Button>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ── */}
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

      {/* ── Reset Password Confirm ── */}
      <AlertDialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600" />
              Redefinir Senha
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Um e-mail de redefinição será enviado para{" "}
                  <strong className="text-foreground">{resetTarget?.email}</strong>.
                  O usuário receberá um link para criar uma nova senha.
                </p>
                <p className="text-xs bg-muted/50 rounded px-3 py-2">
                  A senha atual não é exibida nem armazenada. O link redireciona para a página de redefinição do app.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => resetTarget && resetSenhaMutation.mutate(resetTarget.userId)}
              disabled={resetSenhaMutation.isPending}
            >
              {resetSenhaMutation.isPending ? "Enviando..." : "Enviar E-mail"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
