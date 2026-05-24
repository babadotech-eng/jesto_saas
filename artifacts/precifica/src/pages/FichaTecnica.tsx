import { useState, useRef } from "react";
import { useListFichas, useCreateFicha, useDeleteFicha, useGetFicha, useAddFichaItem, useDeleteFichaItem, useListProdutos, useListInsumos, getListFichasQueryKey, getGetFichaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, ChevronRight, ArrowLeft, Download, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const UNIDADES_RENDIMENTO = ["unidades", "porções", "kg", "L"];

interface ImportItemRow { nome: string; quantidade: number; valid: boolean; error?: string; resolvedId?: string; }

function FichaDetail({ fichaId, onBack }: { fichaId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: ficha, isLoading } = useGetFicha(fichaId, { query: { enabled: !!fichaId, queryKey: getGetFichaQueryKey(fichaId) } });
  const { data: insumos } = useListInsumos();
  const addItemMutation = useAddFichaItem();
  const deleteItemMutation = useDeleteFichaItem();

  const [addInsumoId, setAddInsumoId] = useState("");
  const [addQtd, setAddQtd] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportItemRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAddItem() {
    if (!addInsumoId || !addQtd) { toast.error("Selecione o ingrediente e a quantidade."); return; }
    try {
      await addItemMutation.mutateAsync({ id: fichaId, data: { insumo_id: addInsumoId, quantidade: parseFloat(addQtd) } });
      toast.success("Ingrediente adicionado!");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
      setAddInsumoId(""); setAddQtd("");
    } catch { toast.error("Erro ao adicionar ingrediente."); }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await deleteItemMutation.mutateAsync({ id: fichaId, itemId });
      toast.success("Ingrediente removido.");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
    } catch { toast.error("Erro ao remover ingrediente."); }
  }

  function exportExcel() {
    if (!ficha) { toast.error("Ficha não carregada."); return; }
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "A1A1A1" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      protection: { locked: true },
    };
    const applyHeader = (ws: XLSX.WorkSheet, headers: string[]) => {
      headers.forEach((h, i) => {
        const ref = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!ws[ref]) ws[ref] = { v: h, t: "s" };
        ws[ref].s = headerStyle;
      });
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      ws["!sheetProtect"] = { selectLockedCells: true, selectUnlockedCells: true };
    };

    // Sheet 1: FichasTecnicas
    const fichaHeaders = ["produto", "categoria", "rendimento", "unidade_rendimento", "cmv_total"];
    const wsFicha = XLSX.utils.aoa_to_sheet([
      fichaHeaders,
      [ficha.produto_nome ?? "", "", ficha.rendimento ?? "", ficha.unidade_rendimento ?? "", ficha.cmv_total ?? 0],
    ]);
    wsFicha["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
    applyHeader(wsFicha, fichaHeaders);

    // Sheet 2: Ingredientes
    const ingHeaders = ["ingrediente", "quantidade", "unidade", "custo_item"];
    const ingData = (ficha.itens ?? []).map(item => [
      item.insumo_nome ?? "", item.quantidade, item.unidade ?? "", item.custo_item ?? 0,
    ]);
    const wsIng = XLSX.utils.aoa_to_sheet([ingHeaders, ...ingData]);
    wsIng["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
    applyHeader(wsIng, ingHeaders);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsFicha, "FichasTecnicas");
    XLSX.utils.book_append_sheet(wb, wsIng, "Ingredientes");
    XLSX.writeFile(wb, `ficha_${ficha.produto_nome ?? "tecnica"}.xlsx`);
    toast.success("Planilha exportada!");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(raw, { type: "array" });
      // Prefer "Ingredientes" sheet if present, else first sheet
      const sheetName = wb.SheetNames.find(n => n.toLowerCase() === "ingredientes") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      const parsed: ImportItemRow[] = rows.map(r => {
        const nome = String(r["ingrediente"] ?? r["nome"] ?? "").trim();
        const qtd = Number(r["quantidade"]);
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const resolved = insumos?.find(i => normalize(i.nome) === normalize(nome));
        if (!nome) return { nome, quantidade: qtd, valid: false, error: "Nome vazio" };
        if (isNaN(qtd) || qtd <= 0) return { nome, quantidade: qtd, valid: false, error: "Quantidade inválida" };
        if (!resolved) return { nome, quantidade: qtd, valid: false, error: "Insumo não encontrado", resolvedId: undefined };
        return { nome, quantidade: qtd, valid: true, resolvedId: resolved.id };
      });
      setImportRows(parsed);
      setImportOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function confirmImport() {
    const valid = importRows.filter(r => r.valid && r.resolvedId);
    if (!valid.length) { toast.error("Nenhuma linha válida."); return; }
    setImporting(true);
    let count = 0;
    for (const row of valid) {
      try {
        await addItemMutation.mutateAsync({ id: fichaId, data: { insumo_id: row.resolvedId!, quantidade: row.quantidade } });
        count++;
      } catch { /* skip */ }
    }
    setImporting(false);
    qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
    setImportOpen(false);
    setImportRows([]);
    toast.success(`${count} ingredientes importados.`);
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!ficha) return <div className="text-center py-8 text-muted-foreground">Ficha não encontrada.</div>;

  return (
    <div className="space-y-6" data-testid="ficha-detail">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-ficha"><ArrowLeft size={18} /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{ficha.produto_nome ?? "Ficha Técnica"}</h2>
          <p className="text-sm text-muted-foreground">CMV total: <span className="font-semibold text-foreground">{fmt(ficha.cmv_total ?? 0)}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportExcel}>
            <Download size={14} />Exportar Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <Upload size={14} />Importar Excel
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Ingredientes</h3>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Select value={addInsumoId} onValueChange={setAddInsumoId}>
              <SelectTrigger data-testid="select-item-insumo"><SelectValue placeholder="Selecione o ingrediente..." /></SelectTrigger>
              <SelectContent>{insumos?.map(i => <SelectItem key={i.id} value={i.id}>{i.nome} ({i.unidade})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input type="number" step="0.001" placeholder="Quantidade" value={addQtd} onChange={e => setAddQtd(e.target.value)} className="w-32" data-testid="input-item-quantidade" />
          <Button onClick={handleAddItem} disabled={addItemMutation.isPending} size="sm" data-testid="button-add-item">
            <Plus size={14} className="mr-1" />{addItemMutation.isPending ? "..." : "Adicionar"}
          </Button>
        </div>

        {!ficha.itens?.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
            Nenhum ingrediente adicionado. Use o campo acima para começar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 font-medium text-muted-foreground">Ingrediente</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Qtd</th>
                <th className="text-left py-2 pl-2 font-medium text-muted-foreground hidden sm:table-cell">Unid.</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Custo</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ficha.itens.map(item => (
                <tr key={item.id} className="hover:bg-muted/20" data-testid={`row-item-${item.id}`}>
                  <td className="py-2.5 font-medium">{item.insumo_nome ?? "-"}</td>
                  <td className="py-2.5 text-right">{item.quantidade}</td>
                  <td className="py-2.5 pl-2 text-muted-foreground hidden sm:table-cell">{item.unidade ?? "-"}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{fmt(item.custo_item ?? 0)}</td>
                  <td className="py-2.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(item.id)} data-testid={`button-delete-item-${item.id}`}><Trash2 size={12} className="text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border">
              <tr>
                <td colSpan={3} className="pt-3 font-semibold">CMV Total</td>
                <td className="pt-3 text-right font-bold text-primary">{fmt(ficha.cmv_total ?? 0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={v => { if (!v) { setImportOpen(false); setImportRows([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar Ingredientes</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O nome do ingrediente deve corresponder exatamente a um insumo cadastrado.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ingrediente</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qtd</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importRows.map((r, i) => (
                  <tr key={i} className={r.valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-2">{r.nome || <span className="text-red-500 italic">vazio</span>}</td>
                    <td className="px-3 py-2 text-right">{r.quantidade}</td>
                    <td className="px-3 py-2 text-right">
                      {r.valid ? <span className="text-green-600 text-xs">✓</span> : <span className="text-red-500 text-xs" title={r.error}><X size={12} /></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportRows([]); }}>Cancelar</Button>
            <Button onClick={confirmImport} disabled={importing || !importRows.some(r => r.valid)}>
              {importing ? "Importando..." : `Importar ${importRows.filter(r => r.valid).length} ingredientes`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DraftIngredient { insumo_id: string; quantidade: string; }

function NovaFichaForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const { data: produtos } = useListProdutos();
  const { data: insumos } = useListInsumos();
  const createMutation = useCreateFicha();
  const addItemMutation = useAddFichaItem();

  const [produtoId, setProdutoId] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [unidadeRendimento, setUnidadeRendimento] = useState("unidades");
  const [observacoes, setObservacoes] = useState("");
  const [ingredientes, setIngredientes] = useState<DraftIngredient[]>([{ insumo_id: "", quantidade: "" }]);
  const [saving, setSaving] = useState(false);

  const produtoSelecionado = produtos?.find(p => p.id === produtoId);
  const categoriaHerdada = produtoSelecionado?.categoria ?? null;

  function addIngrediente() { setIngredientes(prev => [...prev, { insumo_id: "", quantidade: "" }]); }
  function removeIngrediente(i: number) { setIngredientes(prev => prev.filter((_, idx) => idx !== i)); }
  function updateIngrediente(i: number, field: keyof DraftIngredient, val: string) {
    setIngredientes(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  const cmvPreview = ingredientes.reduce((sum, ing) => {
    const insumo = insumos?.find(ins => ins.id === ing.insumo_id);
    if (!insumo || !ing.quantidade) return sum;
    return sum + Number(ing.quantidade) * Number(insumo.preco_unitario) * Number(insumo.fator_correcao);
  }, 0);
  const rend = parseFloat(rendimento) || 0;
  const custoPorcao = rend > 0 ? cmvPreview / rend : 0;
  const margemEstimada = produtoSelecionado && Number(produtoSelecionado.preco_venda) > 0
    ? ((Number(produtoSelecionado.preco_venda) - cmvPreview) / Number(produtoSelecionado.preco_venda)) * 100
    : null;

  async function handleSave() {
    if (!produtoId) { toast.error("Selecione um produto."); return; }
    setSaving(true);
    try {
      const ficha = await createMutation.mutateAsync({
        data: {
          produto_id: produtoId,
          rendimento: rend || null,
          unidade_rendimento: unidadeRendimento || null,
        },
      });
      const validIngs = ingredientes.filter(i => i.insumo_id && i.quantidade);
      for (const ing of validIngs) {
        await addItemMutation.mutateAsync({ id: ficha.id, data: { insumo_id: ing.insumo_id, quantidade: parseFloat(ing.quantidade) } });
      }
      qc.invalidateQueries({ queryKey: getListFichasQueryKey() });
      toast.success("Ficha técnica criada!");
      onCreated(ficha.id);
    } catch { toast.error("Erro ao criar ficha técnica."); }
    finally { setSaving(false); }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl" data-testid="nova-ficha-form">
      <div>
        <h2 className="text-xl font-bold mb-1">Nova Ficha Técnica</h2>
        <p className="text-sm text-muted-foreground">Preencha os campos e adicione os ingredientes da receita.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Produto *</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger data-testid="select-ficha-produto"><SelectValue placeholder="Selecione o produto..." /></SelectTrigger>
            <SelectContent>{produtos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <div className={`h-10 px-3 flex items-center rounded-md border border-border text-sm ${categoriaHerdada ? "text-foreground bg-muted/30" : "text-muted-foreground bg-muted/20"}`}>
            {categoriaHerdada ?? (produtoId ? "Produto sem categoria" : "Herdada do produto")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rendimento</Label>
          <Input type="number" step="0.001" placeholder="Ex: 12" value={rendimento} onChange={e => setRendimento(e.target.value)} data-testid="input-ficha-rendimento" />
        </div>
        <div className="space-y-2">
          <Label>Unidade do rendimento</Label>
          <Select value={unidadeRendimento} onValueChange={setUnidadeRendimento}>
            <SelectTrigger data-testid="input-ficha-unidade"><SelectValue /></SelectTrigger>
            <SelectContent>{UNIDADES_RENDIMENTO.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Ingredientes</h3>
        <div className="space-y-2">
          {ingredientes.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select value={ing.insumo_id} onValueChange={v => updateIngrediente(i, "insumo_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o ingrediente..." /></SelectTrigger>
                  <SelectContent>{insumos?.map(ins => <SelectItem key={ins.id} value={ins.id}>{ins.nome} ({ins.unidade})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input
                type="number" step="0.001" placeholder="Qtd"
                className="w-24"
                value={ing.quantidade}
                onChange={e => updateIngrediente(i, "quantidade", e.target.value)}
              />
              <span className="text-xs text-muted-foreground self-center w-8">
                {insumos?.find(ins => ins.id === ing.insumo_id)?.unidade ?? ""}
              </span>
              {ingredientes.length > 1 && (
                <Button variant="ghost" size="icon" type="button" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeIngrediente(i)}>
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3 gap-1" type="button" onClick={addIngrediente}>
          <Plus size={14} />Adicionar ingrediente
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea placeholder="Modo de preparo, dicas, notas..." value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} />
      </div>

      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-1.5 text-sm">
        <p className="font-semibold text-foreground mb-2">Prévia de Custos</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">CMV calculado</span>
          <span className="font-semibold text-foreground">{fmt(cmvPreview)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Custo por {unidadeRendimento.replace("unidades", "unidade").replace("porções", "porção")}</span>
          <span className="font-semibold text-foreground">{rend > 0 ? fmt(custoPorcao) : "-"}</span>
        </div>
        {margemEstimada !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem estimada (s/ MO)</span>
            <span className={`font-semibold ${margemEstimada >= 30 ? "text-green-600" : margemEstimada >= 15 ? "text-amber-600" : "text-red-600"}`}>
              {margemEstimada.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || !produtoId}>
          {saving ? "Salvando..." : "Salvar ficha"}
        </Button>
      </div>
    </div>
  );
}

export default function FichaTecnica() {
  const qc = useQueryClient();
  const { data, isLoading } = useListFichas();
  const deleteMutation = useDeleteFicha();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Ficha excluída.");
      qc.invalidateQueries({ queryKey: getListFichasQueryKey() });
    } catch { toast.error("Erro ao excluir ficha."); }
    setDeleteId(null);
  }

  if (detailId) return <FichaDetail fichaId={detailId} onBack={() => setDetailId(null)} />;

  if (showForm) return (
    <div className="space-y-6" data-testid="ficha-tecnica-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-bold text-foreground">Nova Ficha Técnica</h1>
      </div>
      <NovaFichaForm onCancel={() => setShowForm(false)} onCreated={(id) => { setShowForm(false); setDetailId(id); }} />
    </div>
  );

  return (
    <div className="space-y-6" data-testid="ficha-tecnica-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichas Técnicas</h1>
          <p className="text-sm text-muted-foreground mt-1">Composição e custo de cada receita</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-create-ficha"><Plus size={16} className="mr-2" />Nova Ficha</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><FileText size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhuma ficha técnica</p>
            <p className="text-sm text-muted-foreground mt-1">Crie fichas para calcular o CMV dos seus produtos</p>
          </div>
          <Button onClick={() => setShowForm(true)} data-testid="button-empty-create-ficha"><Plus size={16} className="mr-2" />Criar Ficha Técnica</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(f => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setDetailId(f.id)} data-testid={`card-ficha-${f.id}`}>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <FileText size={18} />
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7" onClick={e => { e.stopPropagation(); setDeleteId(f.id); }} data-testid={`button-delete-ficha-${f.id}`}>
                  <Trash2 size={12} className="text-destructive" />
                </Button>
              </div>
              <p className="font-semibold text-foreground">{f.produto_nome ?? "Produto não vinculado"}</p>
              <p className="text-sm text-muted-foreground mt-1">CMV: <span className="font-medium text-foreground">{fmt(f.cmv_total ?? 0)}</span></p>
              {f.rendimento && <p className="text-xs text-muted-foreground mt-1">Rendimento: {f.rendimento} {f.unidade_rendimento ?? "un"}</p>}
              <div className="flex items-center gap-1 mt-3 text-primary text-xs font-medium">
                Ver detalhes <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir ficha?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
