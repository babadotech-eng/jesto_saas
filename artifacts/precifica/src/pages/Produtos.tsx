import { useState, useRef, useEffect } from "react";
import { useListProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto, getListProdutosQueryKey, useListFuncionarios } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Package, HelpCircle, Download, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function MargemBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <Badge variant="secondary">-</Badge>;
  if (pct > 30) return <Badge className="bg-green-100 text-green-700 border-green-200">{pct.toFixed(1)}%</Badge>;
  if (pct >= 15) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{pct.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">{pct.toFixed(1)}%</Badge>;
}

function TooltipLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="flex items-center gap-1">
      {label}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle size={13} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 text-sm" side="top">
          <p className="text-muted-foreground">{tip}</p>
        </PopoverContent>
      </Popover>
    </span>
  );
}

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().optional(),
  preco_venda: z.coerce.number().min(0),
  custo_mao_obra: z.coerce.number().min(0),
  frete: z.coerce.number().min(0),
  imposto_pct: z.coerce.number().min(0).max(100),
  taxa_cartao_pct: z.coerce.number().min(0).max(100),
  taxa_app_pct: z.coerce.number().min(0).max(100),
  comissao_pct: z.coerce.number().min(0).max(100),
  taxa_vr_pct: z.coerce.number().min(0).max(100),
});
type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  nome: "", categoria: "", preco_venda: 0, custo_mao_obra: 0, frete: 0,
  imposto_pct: 0, taxa_cartao_pct: 0, taxa_app_pct: 0, comissao_pct: 0, taxa_vr_pct: 0,
};

interface ImportRow {
  nome: string; categoria: string | null;
  preco_venda: number; custo_mao_obra: number; frete: number;
  imposto_pct: number; taxa_cartao_pct: number; taxa_app_pct: number;
  comissao_pct: number; taxa_vr_pct: number;
  valid: boolean; error?: string;
}

export default function Produtos() {
  const qc = useQueryClient();
  const { data, isLoading } = useListProdutos();
  const { data: funcionarios } = useListFuncionarios();
  const createMutation = useCreateProduto();
  const updateMutation = useUpdateProduto();
  const deleteMutation = useDeleteProduto();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [prepMinutos, setPrepMinutos] = useState("");
  const [cargoResponsavel, setCargoResponsavel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  // Build cargo → avg valor_hora map from Funcionários data
  const cargoMap: Record<string, number> = (() => {
    const groups: Record<string, number[]> = {};
    (funcionarios ?? []).forEach(f => {
      const cargo = (f.cargo ?? "").trim();
      if (!cargo || f.valor_hora == null) return;
      if (!groups[cargo]) groups[cargo] = [];
      groups[cargo].push(Number(f.valor_hora));
    });
    const result: Record<string, number> = {};
    Object.entries(groups).forEach(([cargo, vals]) => {
      result[cargo] = vals.reduce((s, v) => s + v, 0) / vals.length;
    });
    return result;
  })();
  const cargos = Object.keys(cargoMap);

  // Auto labor cost: (prepMinutos / 60) * valorHora do cargo selecionado
  const autoMaoObra = (() => {
    const mins = parseFloat(prepMinutos);
    if (!cargoResponsavel || isNaN(mins) || mins <= 0) return null;
    const valorHora = cargoMap[cargoResponsavel];
    if (valorHora == null) return null;
    return parseFloat(((mins / 60) * valorHora).toFixed(2));
  })();

  useEffect(() => {
    if (autoMaoObra !== null) {
      form.setValue("custo_mao_obra", autoMaoObra, { shouldValidate: true });
    }
  }, [autoMaoObra]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = data?.filter(p => p.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  function openCreate() {
    setEditingId(null);
    form.reset(defaultValues);
    setPrepMinutos("");
    setCargoResponsavel("");
    setOpen(true);
  }
  function openEdit(p: NonNullable<typeof data>[0]) {
    setEditingId(p.id);
    form.reset({
      nome: p.nome, categoria: p.categoria ?? "",
      preco_venda: p.preco_venda, custo_mao_obra: p.custo_mao_obra, frete: p.frete,
      imposto_pct: p.imposto_pct, taxa_cartao_pct: p.taxa_cartao_pct, taxa_app_pct: p.taxa_app_pct,
      comissao_pct: p.comissao_pct, taxa_vr_pct: p.taxa_vr_pct ?? 0,
    });
    setPrepMinutos("");
    setCargoResponsavel("");
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, categoria: values.categoria || null };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Produto cadastrado com sucesso!");
      }
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar produto."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Produto excluído.");
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    } catch { toast.error("Erro ao excluir produto."); }
    setDeleteId(null);
  }

  // ── Excel template download ──────────────────────────────────────────────
  function downloadTemplate() {
    const headers = [
      "nome", "categoria", "preco_venda", "custo_mao_obra", "frete",
      "imposto_pct", "taxa_cartao_pct", "taxa_app_pct", "comissao_pct", "taxa_vr_pct",
    ];
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ["Marmita fitness", "Marmitas", 22.90, 4.50, 0, 6, 2.5, 0, 0, 0],
      ["Bolo de cenoura", "Bolos", 45.00, 8.00, 0, 6, 0, 12, 0, 0],
      ["Coxinha frango", "Salgados", 5.50, 1.20, 0, 0, 2.5, 15, 5, 0],
    ]);
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "A1A1A1" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      protection: { locked: true },
    };
    headers.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!ws[cellRef]) ws[cellRef] = { v: headers[i], t: "s" };
      ws[cellRef].s = headerStyle;
    });
    ws["!cols"] = [
      { wch: 25 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 10 },
      { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 13 },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "produtos_modelo.xlsx");
    toast.success("Planilha modelo baixada!");
  }

  // ── Excel import parse ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawData = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(rawData, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      const parsed: ImportRow[] = rows.map(r => {
        const nome = String(r["nome"] ?? "").trim();
        const categoria = r["categoria"] ? String(r["categoria"]).trim() : null;
        const preco_venda = Number(r["preco_venda"]);
        const custo_mao_obra = Number(r["custo_mao_obra"] ?? 0) || 0;
        const frete = Number(r["frete"] ?? 0) || 0;
        const imposto_pct = Number(r["imposto_pct"] ?? 0) || 0;
        const taxa_cartao_pct = Number(r["taxa_cartao_pct"] ?? 0) || 0;
        const taxa_app_pct = Number(r["taxa_app_pct"] ?? 0) || 0;
        const comissao_pct = Number(r["comissao_pct"] ?? 0) || 0;
        const taxa_vr_pct = Number(r["taxa_vr_pct"] ?? 0) || 0;
        const base = { nome, categoria, preco_venda, custo_mao_obra, frete, imposto_pct, taxa_cartao_pct, taxa_app_pct, comissao_pct, taxa_vr_pct };
        if (!nome) return { ...base, valid: false, error: "Nome obrigatório" };
        if (isNaN(preco_venda) || preco_venda < 0) return { ...base, valid: false, error: "Preço inválido" };
        return { ...base, valid: true };
      });
      setImportRows(parsed);
      setImportOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function confirmImport() {
    const valid = importRows.filter(r => r.valid);
    const errors = importRows.filter(r => !r.valid).length;
    if (!valid.length) { toast.error("Nenhuma linha válida para importar."); return; }
    setImporting(true);
    let successCount = 0;
    for (const row of valid) {
      try {
        await createMutation.mutateAsync({
          data: {
            nome: row.nome, categoria: row.categoria,
            preco_venda: row.preco_venda, custo_mao_obra: row.custo_mao_obra, frete: row.frete,
            imposto_pct: row.imposto_pct, taxa_cartao_pct: row.taxa_cartao_pct,
            taxa_app_pct: row.taxa_app_pct, comissao_pct: row.comissao_pct, taxa_vr_pct: row.taxa_vr_pct,
          }
        });
        successCount++;
      } catch { /* skip row errors */ }
    }
    setImporting(false);
    qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    setImportOpen(false);
    setImportRows([]);
    toast.success(`${successCount} produtos importados.${errors > 0 ? ` ${errors} erros ignorados.` : ""}`);
  }

  const watchedValues = form.watch();
  const editingProduto = editingId ? data?.find(p => p.id === editingId) : null;
  const cmv = Number(editingProduto?.cmv ?? 0);
  const preco = Number(watchedValues.preco_venda) || 0;
  const imposto = preco * (Number(watchedValues.imposto_pct) || 0) / 100;
  const taxaCartao = preco * (Number(watchedValues.taxa_cartao_pct) || 0) / 100;
  const taxaApp = preco * (Number(watchedValues.taxa_app_pct) || 0) / 100;
  const comissao = preco * (Number(watchedValues.comissao_pct) || 0) / 100;
  const taxaVr = preco * (Number(watchedValues.taxa_vr_pct) || 0) / 100;
  const maoObra = Number(watchedValues.custo_mao_obra) || 0;
  const frete = Number(watchedValues.frete) || 0;
  const margem = preco - cmv - maoObra - frete - imposto - taxaCartao - taxaApp - comissao - taxaVr;
  const margemPct = preco > 0 ? (margem / preco) * 100 : 0;

  return (
    <div className="space-y-6" data-testid="produtos-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus produtos e precificações</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
            <Download size={14} />Baixar planilha modelo
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <Upload size={14} />Importar Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          <Button onClick={openCreate} data-testid="button-create-produto"><Plus size={16} className="mr-2" />Novo Produto</Button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-produtos" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Package size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Comece cadastrando seu primeiro produto</p>
          </div>
          <Button onClick={openCreate} data-testid="button-empty-create-produto"><Plus size={16} className="mr-2" />Cadastrar Produto</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">CMV</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Margem</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-produto-${p.id}`}>
                  <td className="px-4 py-3 font-medium">{p.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.categoria ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(p.preco_venda)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{fmt(p.cmv ?? 0)}</td>
                  <td className="px-4 py-3 text-center"><MargemBadge pct={p.margem_pct ?? null} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-produto-${p.id}`}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-produto-${p.id}`}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} data-testid="input-produto-nome" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} placeholder="Ex: Bolos, Salgados, Marmitas" data-testid="input-produto-categoria" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="preco_venda" render={({ field }) => (
                  <FormItem><FormLabel>Preço de Venda (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-preco" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="custo_mao_obra" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TooltipLabel
                        label="Mão de Obra (R$)"
                        tip="Custo direto de mão de obra por unidade produzida. Preenchido automaticamente quando o cargo e o tempo de preparo são informados."
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.01"
                        {...field}
                        readOnly={autoMaoObra !== null}
                        className={autoMaoObra !== null ? "bg-muted cursor-not-allowed" : ""}
                        data-testid="input-produto-mao-obra"
                      />
                    </FormControl>
                    {autoMaoObra !== null && (
                      <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
                    )}
                    {autoMaoObra === null && cargos.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem funcionários com cargo — insira manualmente.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Tempo de preparo + Cargo/Função — usados para cálculo automático de mão de obra */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tempo de preparo (min)</Label>
                  <Input
                    type="number" step="1" min="0" placeholder="Ex: 15"
                    value={prepMinutos}
                    onChange={e => setPrepMinutos(e.target.value)}
                    data-testid="input-produto-prep-minutos"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cargo/Função responsável</Label>
                  {cargos.length > 0 ? (
                    <Select value={cargoResponsavel} onValueChange={setCargoResponsavel}>
                      <SelectTrigger data-testid="select-produto-cargo">
                        <SelectValue placeholder="Selecione o cargo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cargos.map(c => (
                          <SelectItem key={c} value={c}>
                            {c} — {fmt(cargoMap[c])}/h
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input disabled placeholder="Nenhum cargo cadastrado" />
                  )}
                  {cargoResponsavel && prepMinutos && autoMaoObra !== null && (
                    <p className="text-xs text-muted-foreground">
                      {fmt(cargoMap[cargoResponsavel])}/h × {prepMinutos} min = {fmt(autoMaoObra)}
                    </p>
                  )}
                </div>

                <FormField control={form.control} name="frete" render={({ field }) => (
                  <FormItem><FormLabel>Frete (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-frete" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imposto_pct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TooltipLabel
                        label="Imposto (%)"
                        tip="Alíquota de imposto incidente sobre a venda. Para MEI isento, use 0. Para Simples Nacional, use a alíquota da sua faixa (ex: 6%). DAS, ISS, ICMS dependem do seu regime."
                      />
                    </FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-imposto" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="taxa_cartao_pct" render={({ field }) => (
                  <FormItem><FormLabel>Taxa Cartão (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-taxa-cartao" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taxa_app_pct" render={({ field }) => (
                  <FormItem><FormLabel>Taxa App (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-taxa-app" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="comissao_pct" render={({ field }) => (
                  <FormItem><FormLabel>Comissão (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-comissao" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taxa_vr_pct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <TooltipLabel
                        label="Taxa Vale Refeição (%)"
                        tip="Taxa cobrada pelas operadoras de Vale Refeição (VR/VA) como Alelo, Sodexo, VR, Ticket. Geralmente entre 5% e 15% do valor da venda."
                      />
                    </FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} data-testid="input-produto-taxa-vr" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Live calculation preview */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-foreground mb-2">Cálculo em tempo real</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Preço de venda</span><span className="font-medium text-foreground">{fmt(preco)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>CMV (ingredientes)</span><span>{fmt(cmv)}</span>
                </div>
                {cmv === 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 my-2">
                    Sem ficha técnica vinculada — o CMV está em R$ 0,00. Cadastre uma ficha técnica em <strong>Fichas Técnicas</strong> para calcular o custo dos ingredientes automaticamente.
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Mão de obra</span><span>- {fmt(maoObra)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span><span>- {fmt(frete)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Impostos + taxas + VR</span><span>- {fmt(imposto + taxaCartao + taxaApp + comissao + taxaVr)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-1">
                  <span className="font-semibold">Margem de contribuição</span>
                  <span className="font-bold">{fmt(margem)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Margem %</span>
                  <span className={`font-bold ${margemPct > 30 ? "text-green-600" : margemPct >= 15 ? "text-yellow-600" : "text-red-500"}`}>{margemPct.toFixed(1)}%</span>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-produto">
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importOpen} onOpenChange={v => { if (!v) { setImportOpen(false); setImportRows([]); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Prévia da Importação</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            {importRows.filter(r => r.valid).length} linhas válidas · {importRows.filter(r => !r.valid).length} com erros (serão ignoradas)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Preço</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importRows.map((r, i) => (
                  <tr key={i} className={r.valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-2">{r.nome || <span className="text-red-500 italic">vazio</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{r.categoria ?? "-"}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.preco_venda)}</td>
                    <td className="px-3 py-2 text-right">
                      {r.valid
                        ? <span className="text-green-600 text-xs">✓</span>
                        : <span className="text-red-500 text-xs" title={r.error}><X size={12} /></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportRows([]); }}>Cancelar</Button>
            <Button onClick={confirmImport} disabled={importing || !importRows.some(r => r.valid)}>
              {importing ? "Importando..." : `Importar ${importRows.filter(r => r.valid).length} produtos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
