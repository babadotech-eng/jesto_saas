import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Tag, ToggleLeft, ToggleRight, Trash2, X, Layers, CheckCircle2,
} from "lucide-react";
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

const EMPTY_SHARED = {
  tipo: "percentual" as "percentual" | "fixo",
  desconto: "",
  dataInicio: new Date().toISOString().slice(0, 10),
  dataExpiracao: "",
  limiteUsos: "",
};

type BatchMode = "manual" | "auto";
type BatchResult = { criados: string[]; pulados: string[] };

function SharedSettings({
  value, onChange,
}: {
  value: typeof EMPTY_SHARED;
  onChange: (v: typeof EMPTY_SHARED) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-1.5">
        <Label>Tipo de Desconto *</Label>
        <select
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={value.tipo}
          onChange={e => onChange({ ...value, tipo: e.target.value as "percentual" | "fixo" })}
        >
          <option value="percentual">Percentual (%)</option>
          <option value="fixo">Valor Fixo (R$)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Desconto *</Label>
        <div className="relative">
          <Input
            type="number" min="0.01" step="0.01"
            placeholder={value.tipo === "percentual" ? "Ex: 20" : "Ex: 10.00"}
            value={value.desconto}
            onChange={e => onChange({ ...value, desconto: e.target.value })}
            className="pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
            {value.tipo === "percentual" ? "%" : "R$"}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Data de Início *</Label>
        <Input
          type="date" value={value.dataInicio}
          onChange={e => onChange({ ...value, dataInicio: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Data de Expiração</Label>
        <Input
          type="date" value={value.dataExpiracao} min={value.dataInicio}
          onChange={e => onChange({ ...value, dataExpiracao: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Limite de Usos</Label>
        <Input
          type="number" min="1" step="1" placeholder="Ilimitado"
          value={value.limiteUsos}
          onChange={e => onChange({ ...value, limiteUsos: e.target.value })}
        />
      </div>
    </div>
  );
}

export default function AdminCodigos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminCodigo | null>(null);

  const [batchMode, setBatchMode] = useState<BatchMode>("manual");
  const [batchCodes, setBatchCodes] = useState("");
  const [batchBase, setBatchBase] = useState("");
  const [batchQtd, setBatchQtd] = useState("10");
  const [shared, setShared] = useState(EMPTY_SHARED);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

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
        throw new Error((body as { error?: string }).error ?? "Erro ao criar cupom");
      }
    },
    onSuccess: () => {
      toast.success("Cupom criado!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const baseBody = {
        tipo: shared.tipo,
        desconto: Number(shared.desconto),
        dataInicio: new Date(shared.dataInicio).toISOString(),
        dataExpiracao: shared.dataExpiracao ? new Date(shared.dataExpiracao).toISOString() : null,
        limiteUsos: shared.limiteUsos ? Number(shared.limiteUsos) : null,
      };

      let body: Record<string, unknown>;
      if (batchMode === "manual") {
        const codes = batchCodes.split("\n").map(l => l.trim().toUpperCase()).filter(Boolean);
        body = { ...baseBody, codes };
      } else {
        body = { ...baseBody, base: batchBase.trim() || undefined, quantidade: Number(batchQtd) };
      }

      const res = await adminFetch("/api/admin/codigos/lote", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error((b as { error?: string }).error ?? "Erro ao criar cupons");
      }
      return res.json() as Promise<BatchResult>;
    },
    onSuccess: (result) => {
      setBatchResult(result);
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
      if (result.criados.length > 0) {
        toast.success(`${result.criados.length} cupom${result.criados.length !== 1 ? "s" : ""} criado${result.criados.length !== 1 ? "s" : ""}!`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await adminFetch(`/api/admin/codigos/${id}/ativo`, {
        method: "PUT",
        body: JSON.stringify({ ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "codigos"] }),
    onError: () => toast.error("Erro ao atualizar o cupom."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminFetch(`/api/admin/codigos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
    },
    onSuccess: () => {
      toast.success("Cupom excluído.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "codigos"] });
    },
    onError: () => toast.error("Erro ao excluir o cupom."),
  });

  function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo || !form.desconto || Number(form.desconto) <= 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    createMutation.mutate();
  }

  function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBatchResult(null);
    if (!shared.desconto || Number(shared.desconto) <= 0) {
      toast.error("Informe o desconto.");
      return;
    }
    if (batchMode === "manual" && !batchCodes.trim()) {
      toast.error("Cole pelo menos um código.");
      return;
    }
    if (batchMode === "auto" && (!batchQtd || Number(batchQtd) < 1)) {
      toast.error("Informe a quantidade.");
      return;
    }
    batchMutation.mutate();
  }

  const manualCount = batchCodes.split("\n").filter(l => l.trim()).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cupons Promocionais</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie e gerencie códigos de desconto</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm" variant="outline" className="gap-1.5"
            onClick={() => { setShowBulk(v => !v); setShowForm(false); setBatchResult(null); }}
          >
            {showBulk ? <X size={14} /> : <Layers size={14} />}
            {showBulk ? "Cancelar" : "Criar em Lote"}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => { setShowForm(v => !v); setShowBulk(false); }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancelar" : "Novo Cupom"}
          </Button>
        </div>
      </div>

      {/* ── Single Create Form ── */}
      {showForm && (
        <form onSubmit={handleSingleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Tag size={16} className="text-amber-500" />Novo Cupom
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo" placeholder="EX: PROMO20"
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
                  id="desconto" type="number" min="0.01" step="0.01"
                  placeholder={form.tipo === "percentual" ? "Ex: 20" : "Ex: 10.00"}
                  value={form.desconto}
                  onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))}
                  required className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  {form.tipo === "percentual" ? "%" : "R$"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input id="dataInicio" type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataExpiracao">Data de Expiração</Label>
              <Input id="dataExpiracao" type="date" value={form.dataExpiracao} min={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataExpiracao: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limiteUsos">Limite de Usos</Label>
              <Input id="limiteUsos" type="number" min="1" step="1" placeholder="Ilimitado" value={form.limiteUsos} onChange={e => setForm(f => ({ ...f, limiteUsos: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Bulk Create Form ── */}
      {showBulk && (
        <form onSubmit={handleBatchSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Layers size={16} className="text-amber-500" />Criar em Lote
          </h3>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {(["manual", "auto"] as const).map(m => (
              <button
                key={m} type="button"
                onClick={() => { setBatchMode(m); setBatchResult(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  batchMode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "manual" ? "Lote Manual" : "Auto-gerar"}
              </button>
            ))}
          </div>

          {batchMode === "manual" ? (
            <div className="space-y-1.5">
              <Label htmlFor="batchCodes">
                Códigos — um por linha *
                {manualCount > 0 && <span className="ml-2 text-muted-foreground font-normal">({manualCount} código{manualCount !== 1 ? "s" : ""})</span>}
              </Label>
              <textarea
                id="batchCodes"
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={"VERAO20\nBURGER10\nLANCHE50"}
                value={batchCodes}
                onChange={e => { setBatchCodes(e.target.value); setBatchResult(null); }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="batchBase">Palavra-base / Prefixo</Label>
                <Input
                  id="batchBase"
                  placeholder="Ex: BURGER, VERAO, HOTDOG"
                  value={batchBase}
                  onChange={e => { setBatchBase(e.target.value.toUpperCase()); setBatchResult(null); }}
                />
                <p className="text-xs text-muted-foreground">Deixe em branco para gerar como PREC-XXXX</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batchQtd">Quantidade *</Label>
                <Input
                  id="batchQtd" type="number" min="1" max="100" step="1"
                  placeholder="Ex: 10"
                  value={batchQtd}
                  onChange={e => { setBatchQtd(e.target.value); setBatchResult(null); }}
                />
                <p className="text-xs text-muted-foreground">Máximo de 100 por lote</p>
              </div>
              {batchBase && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                    Exemplos gerados:{" "}
                    <span className="font-mono font-medium">{batchBase}-A3K2</span>,{" "}
                    <span className="font-mono font-medium">{batchBase}-B9PQ</span>,{" "}
                    <span className="font-mono font-medium">{batchBase}-Z4MN</span>...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Shared settings */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Configurações aplicadas a todos os cupons do lote</p>
            <SharedSettings value={shared} onChange={setShared} />
          </div>

          {/* Result */}
          {batchResult && (
            <div className={`rounded-lg border px-4 py-3 text-sm space-y-1.5 ${batchResult.criados.length > 0 ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                <span>
                  {batchResult.criados.length} cupom{batchResult.criados.length !== 1 ? "s" : ""} criado{batchResult.criados.length !== 1 ? "s" : ""} com sucesso
                </span>
              </div>
              {batchResult.pulados.length > 0 && (
                <p className="text-muted-foreground text-xs pl-5">
                  {batchResult.pulados.length} ignorado{batchResult.pulados.length !== 1 ? "s" : ""} por já existirem:{" "}
                  <span className="font-mono">{batchResult.pulados.join(", ")}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowBulk(false); setBatchResult(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={batchMutation.isPending}>
              {batchMutation.isPending ? "Criando..." : "Criar Lote"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Codes Table ── */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Tag size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Nenhum cupom criado ainda.</p>
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
                      {code.tipo === "percentual" ? `${Number(code.desconto)}% off` : `R$ ${Number(code.desconto).toFixed(2)} off`}
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
                          variant="ghost" size="icon" className="h-7 w-7"
                          title={code.ativo ? "Desativar" : "Ativar"}
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ id: code.id, ativo: !code.ativo })}
                        >
                          {code.ativo
                            ? <ToggleRight size={16} className="text-green-600" />
                            : <ToggleLeft size={16} className="text-gray-400" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
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
