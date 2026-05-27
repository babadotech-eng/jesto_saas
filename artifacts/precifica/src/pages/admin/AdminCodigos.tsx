import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminFetch, type AdminCodigo } from "@/lib/adminFetch";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

function getCodigoStatus(code: AdminCodigo): { label: string; color: string } {
  if (!code.ativo) return { label: "Inativo", color: "text-gray-500" };
  const now = new Date();
  if (new Date(code.dataInicio) > now) return { label: "Agendado", color: "text-blue-600" };
  if (code.dataExpiracao && new Date(code.dataExpiracao) < now) return { label: "Expirado", color: "text-yellow-600" };
  if (code.limiteUsos !== null && code.usosAtuais >= code.limiteUsos) return { label: "Esgotado", color: "text-red-500" };
  return { label: "Ativo", color: "text-green-600" };
}

const EMPTY_FORM = {
  codigo: "",
  tipo: "percentual" as "percentual" | "fixo",
  desconto: "",
  dataInicio: new Date().toISOString().slice(0, 10),
  dataExpiracao: "",
  limiteUsos: "",
};

export default function AdminCodigos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminCodigo | null>(null);

  const { data, isLoading } = useQuery<AdminCodigo[]>({
    queryKey: ["admin", "codigos"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/codigos");
      if (!res.ok) throw new Error("Erro ao buscar cupons");
      return res.json();
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/codigos", {
        method: "POST",
        body: JSON.stringify({
          codigo: form.codigo.trim().toUpperCase(),
          tipo: form.tipo,
          desconto: Number(form.desconto),
          dataInicio: new Date(form.dataInicio).toISOString(),
          dataExpiracao: form.dataExpiracao ? new Date(form.dataExpiracao).toISOString() : null,
          limiteUsos: form.limiteUsos ? Number(form.limiteUsos) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao criar cupom");
      }
    },
    onSuccess: () => {
      toast.success("Cupom criado com sucesso!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await adminFetch(`/api/admin/codigos/${id}/ativo`, {
        method: "PUT",
        body: JSON.stringify({ ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cupom");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
    },
    onError: () => toast.error("Erro ao atualizar o cupom."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`/api/admin/codigos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir cupom");
    },
    onSuccess: () => {
      toast.success("Cupom excluído.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
    },
    onError: () => toast.error("Erro ao excluir o cupom."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo || !form.desconto || Number(form.desconto) <= 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cupons Promocionais</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie e gerencie códigos de desconto</p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancelar" : "Novo Cupom"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Tag size={16} className="text-amber-500" />
            Novo Cupom Promocional
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="EX: PROMO20"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de Desconto *</Label>
              <select
                id="tipo"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as "percentual" | "fixo" }))}
              >
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desconto">Desconto *</Label>
              <div className="relative">
                <Input
                  id="desconto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={form.tipo === "percentual" ? "Ex: 20" : "Ex: 10.00"}
                  value={form.desconto}
                  onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                  required
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  {form.tipo === "percentual" ? "%" : "R$"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={form.dataInicio}
                onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataExpiracao">Data de Expiração</Label>
              <Input
                id="dataExpiracao"
                type="date"
                value={form.dataExpiracao}
                min={form.dataInicio}
                onChange={e => setForm(f => ({ ...f, dataExpiracao: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limiteUsos">Limite de Usos</Label>
              <Input
                id="limiteUsos"
                type="number"
                min="1"
                step="1"
                placeholder="Ilimitado"
                value={form.limiteUsos}
                onChange={e => setForm(f => ({ ...f, limiteUsos: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Tag size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Nenhum cupom criado ainda. Crie o primeiro!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Desconto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Início</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiração</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Usos</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(code => {
                const st = getCodigoStatus(code);
                return (
                  <tr key={code.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-sm bg-muted px-2 py-0.5 rounded">
                        {code.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {code.tipo === "percentual"
                        ? `${Number(code.desconto)}% off`
                        : `R$ ${Number(code.desconto).toFixed(2)} off`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{fmtDate(code.dataInicio)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(code.dataExpiracao)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {code.usosAtuais}{code.limiteUsos !== null ? ` / ${code.limiteUsos}` : " / ∞"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={code.ativo ? "Desativar" : "Ativar"}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ id: code.id, ativo: !code.ativo })}
                        >
                          {code.ativo
                            ? <ToggleRight size={16} className="text-green-600" />
                            : <ToggleLeft size={16} className="text-gray-400" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Excluir"
                          onClick={() => setDeleteTarget(code)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
        <strong>Endpoint de validação:</strong> <code>POST /api/promo-codes/validar</code> — disponível para integração na página de planos quando necessário.
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              O cupom <strong className="font-mono">{deleteTarget?.codigo}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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
