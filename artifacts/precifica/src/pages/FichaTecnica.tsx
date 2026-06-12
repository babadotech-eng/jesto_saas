import { useState, useRef, useMemo, useEffect } from "react";
import { useListFichas, useCreateFicha, useDeleteFicha, useGetFicha, useAddFichaItem, useDeleteFichaItem, useUpdateFichaItem, useListProdutos, useListInsumos, getListFichasQueryKey, getGetFichaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssinatura } from "@/hooks/useAssinatura";
import { getLimites, getFeatures } from "@/lib/planConfig";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { Plus, Trash2, FileText, ArrowLeft, X, ChevronsUpDown, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const UNIDADES_RENDIMENTO = ["unidades", "porções", "kg", "L", "dz", "pacote"];

const UNIDADES_FRACAO: Record<string, string[]> = {
  kg: ["g", "kg"],
  g: ["g", "kg"],
  L: ["ml", "L"],
  ml: ["ml", "L"],
  un: ["un", "dz"],
  unid: ["un", "dz"],
  dz: ["un", "dz"],
};

function getUnidadesParaInsumo(nativeUnit: string): string[] {
  return UNIDADES_FRACAO[nativeUnit] ?? [nativeUnit];
}

type InsumoOption = { id: string; nome: string; unidade: string };

function InsumoCombobox({
  insumos,
  value,
  onValueChange,
}: {
  insumos: InsumoOption[] | undefined;
  value: string;
  onValueChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = insumos?.find(i => i.id === value);

  const filtered = useMemo(() => {
    if (!insumos) return [];
    const q = search.toLowerCase();
    if (!q) return insumos;
    return insumos.filter(i =>
      i.nome.toLowerCase().includes(q) || i.unidade.toLowerCase().includes(q)
    );
  }, [insumos, search]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground")}>
          {selected ? `${selected.nome} (${selected.unidade})` : "Selecione o ingrediente..."}
        </span>
        <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Buscar ingrediente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum ingrediente encontrado.</li>
            ) : filtered.map(i => (
              <li
                key={i.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground rounded-sm mx-1",
                  value === i.id && "bg-accent/50"
                )}
                onMouseDown={e => {
                  e.preventDefault();
                  onValueChange(i.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check size={13} className={cn("shrink-0", value === i.id ? "opacity-100" : "opacity-0")} />
                {i.nome} ({i.unidade})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function convertToNativeUnit(qty: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return qty;
  // "unid" and "un" are the same physical unit (1:1)
  const norm = (u: string) => (u === "unid" ? "un" : u);
  const from = norm(fromUnit);
  const to = norm(toUnit);
  if (from === to) return qty;
  if (from === "g" && to === "kg") return qty / 1000;
  if (from === "kg" && to === "g") return qty * 1000;
  if (from === "ml" && to === "L") return qty / 1000;
  if (from === "L" && to === "ml") return qty * 1000;
  if (from === "dz" && to === "un") return qty * 12;
  if (from === "un" && to === "dz") return qty / 12;
  return qty;
}

interface ImportItemRow { nome: string; quantidade: number; valid: boolean; error?: string; resolvedId?: string; }

function FichaDetail({ fichaId, onBack }: { fichaId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: ficha, isLoading } = useGetFicha(fichaId, { query: { enabled: !!fichaId, queryKey: getGetFichaQueryKey(fichaId) } });
  const { data: insumos } = useListInsumos();
  const addItemMutation = useAddFichaItem();
  const deleteItemMutation = useDeleteFichaItem();

  const [addInsumoId, setAddInsumoId] = useState("");
  const [addQtd, setAddQtd] = useState("");
  const [addUnit, setAddUnit] = useState("");
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const updateItemMutation = useUpdateFichaItem();

  const selectedInsumo = insumos?.find(i => i.id === addInsumoId);
  const nativeUnit = selectedInsumo?.unidade ?? "";
  const unitOptions = nativeUnit ? getUnidadesParaInsumo(nativeUnit) : [];
  const effectiveUnit = addUnit || nativeUnit;

  const custoPreview = (() => {
    if (!selectedInsumo || !addQtd) return null;
    const qtd = parseFloat(addQtd);
    if (isNaN(qtd) || qtd <= 0) return null;
    const converted = convertToNativeUnit(qtd, effectiveUnit, nativeUnit);
    return converted * Number(selectedInsumo.preco_unitario) * Number(selectedInsumo.fator_correcao);
  })();

  function handleInsumoChange(id: string) {
    setAddInsumoId(id);
    setAddUnit("");
  }

  async function handleAddItem() {
    if (!addInsumoId || !addQtd) { toast.error("Selecione o ingrediente e a quantidade."); return; }
    const qtd = parseFloat(addQtd);
    if (isNaN(qtd) || qtd <= 0) { toast.error("Quantidade inválida."); return; }
    const jaAdicionado = ficha?.itens?.some(it => it.insumo_id === addInsumoId);
    if (jaAdicionado) {
      const nomeInsumo = insumos?.find(i => i.id === addInsumoId)?.nome ?? "esse ingrediente";
      toast.warning(`"${nomeInsumo}" já está nesta ficha. Remova o existente antes de adicionar novamente.`);
      return;
    }
    const converted = convertToNativeUnit(qtd, effectiveUnit, nativeUnit);
    try {
      await addItemMutation.mutateAsync({ id: fichaId, data: { insumo_id: addInsumoId, quantidade: converted } });
      toast.success("Ingrediente adicionado!");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
      setAddInsumoId(""); setAddQtd(""); setAddUnit("");
    } catch { toast.error("Erro ao adicionar ingrediente."); }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await deleteItemMutation.mutateAsync({ id: fichaId, itemId });
      toast.success("Ingrediente removido.");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
    } catch { toast.error("Erro ao remover ingrediente."); }
  }

  function startEdit(item: { id: string; quantidade: number; unidade?: string | null }) {
    setEditItemId(item.id);
    setEditQty(String(item.quantidade));
    setEditUnit(item.unidade ?? "");
  }

  function cancelEdit() {
    setEditItemId(null);
    setEditQty("");
    setEditUnit("");
  }

  async function saveEdit(item: { id: string; insumo_id: string; unidade?: string | null }) {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty <= 0) { toast.error("Quantidade inválida."); return; }
    const itemNativeUnit = item.unidade ?? editUnit;
    const converted = convertToNativeUnit(qty, editUnit || itemNativeUnit, itemNativeUnit);
    try {
      await updateItemMutation.mutateAsync({ id: fichaId, itemId: item.id, data: { insumo_id: item.insumo_id, quantidade: converted } });
      toast.success("Quantidade atualizada.");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
      cancelEdit();
    } catch { toast.error("Erro ao atualizar ingrediente."); }
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();

    // Aba 1 — Instrucoes
    const instrucoes = [
      ["MODELO DE FICHA TÉCNICA — INSTRUÇÕES DE PREENCHIMENTO"],
      [""],
      ["Como usar este arquivo:"],
      ["1. Acesse a aba 'Ingredientes' (aba ao lado)."],
      ["2. Preencha UMA LINHA por ingrediente utilizado na receita."],
      ["3. Se um produto usa 5 ingredientes, terá 5 linhas preenchidas."],
      ["4. NÃO altere os nomes das colunas (linha 1 da aba Ingredientes)."],
      ["5. Salve no formato .xlsx e faça o upload na aba Ficha Técnica do app."],
      [""],
      ["COLUNAS DA ABA 'Ingredientes':"],
      [""],
      ["  ingrediente  (OBRIGATÓRIO)"],
      ["    → Nome exato do insumo cadastrado no app."],
      ["    → Consulte a aba 'Insumos_Cadastrados' para ver os nomes disponíveis."],
      ["    → O nome deve ser idêntico ao cadastrado (sem espaços extras)."],
      [""],
      ["  quantidade   (OBRIGATÓRIO)"],
      ["    → Quantidade usada na receita (número)."],
      ["    → Exemplos: 0.25 (para 250g), 2 (para 2 unidades), 0.5 (para 500ml)."],
      [""],
      ["  unidade      (informativo — não importado)"],
      ["    → Apenas referência visual. Não é importada pelo app."],
      [""],
      ["  observacao   (opcional — não importado)"],
      ["    → Anotações livres sobre o ingrediente ou modo de preparo."],
      [""],
      ["ATENÇÃO:"],
      ["  • O app importa os ingredientes para a ficha técnica que estiver aberta."],
      ["  • Em caso de erro, verifique se o nome do ingrediente está idêntico ao"],
      ["    insumo cadastrado (sem acento diferente ou espaço extra)."],
      ["  • Linhas com nome vazio ou quantidade inválida serão ignoradas."],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instrucoes);
    wsInst["!cols"] = [{ wch: 75 }];
    XLSX.utils.book_append_sheet(wb, wsInst, "Instrucoes");

    // Aba 2 — Ingredientes (aba lida no upload)
    const headers = ["ingrediente", "quantidade", "unidade", "observacao"];
    const exemplos = [
      ["Farinha de trigo", 0.5, "kg", "Peneirar antes de usar"],
      ["Ovos", 3, "un", ""],
      ["Açúcar refinado", 0.2, "kg", ""],
      ["Manteiga sem sal", 0.1, "kg", "Temperatura ambiente"],
      ["Leite integral", 0.25, "L", ""],
      ["← apague estas linhas de exemplo e preencha com seus ingredientes", "", "", ""],
    ];
    const wsIng = XLSX.utils.aoa_to_sheet([headers, ...exemplos]);
    wsIng["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 12 }, { wch: 40 }];
    wsIng["!freeze"] = { xSplit: 0, ySplit: 1 };
    const hStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "4D2F70" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
    headers.forEach((h, i) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!wsIng[ref]) wsIng[ref] = { v: h, t: "s" };
      wsIng[ref].s = hStyle;
    });
    XLSX.utils.book_append_sheet(wb, wsIng, "Ingredientes");

    // Aba 3 — Insumos cadastrados (referência de nomes exatos)
    if (insumos && insumos.length > 0) {
      const insHeaders = ["nome_insumo", "unidade"];
      const insData = insumos.map(ins => [ins.nome, ins.unidade]);
      const wsIns = XLSX.utils.aoa_to_sheet([insHeaders, ...insData]);
      wsIns["!cols"] = [{ wch: 38 }, { wch: 14 }];
      const insHStyle = { font: { bold: true }, fill: { patternType: "solid", fgColor: { rgb: "EAE0F4" } } };
      insHeaders.forEach((h, i) => {
        const ref = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!wsIns[ref]) wsIns[ref] = { v: h, t: "s" };
        wsIns[ref].s = insHStyle;
      });
      XLSX.utils.book_append_sheet(wb, wsIns, "Insumos_Cadastrados");
    }

    XLSX.writeFile(wb, "modelo_ficha_tecnica.xlsx");
    toast.success("Modelo baixado! Preencha a aba 'Ingredientes' e faça o upload.");
  }

  function exportExcel() {
    if (!ficha) { toast.error("Ficha não carregada."); return; }
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "FFDF20" } },
      font: { bold: true, color: { rgb: "1A1A1A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: "medium", color: { rgb: "C8A800" } } },
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

    const fichaHeaders = ["produto", "categoria", "rendimento", "unidade_rendimento", "cmv_total"];
    const wsFicha = XLSX.utils.aoa_to_sheet([
      fichaHeaders,
      [ficha.produto_nome ?? "", "", ficha.rendimento ?? "", ficha.unidade_rendimento ?? "", ficha.cmv_total ?? 0],
    ]);
    wsFicha["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
    applyHeader(wsFicha, fichaHeaders);

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
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold mb-4">Ingredientes</h3>

        <div className="flex gap-2 mb-1 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <InsumoCombobox insumos={insumos} value={addInsumoId} onValueChange={handleInsumoChange} />
          </div>
          <Input
            type="number" step="0.001" placeholder="Quantidade"
            value={addQtd} onChange={e => setAddQtd(e.target.value)}
            className="w-28" data-testid="input-item-quantidade"
          />
          {unitOptions.length > 1 ? (
            <Select value={effectiveUnit} onValueChange={setAddUnit}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <div className="flex items-center px-2 text-sm text-muted-foreground w-16">{nativeUnit}</div>
          )}
          <Button onClick={handleAddItem} disabled={addItemMutation.isPending} size="sm" data-testid="button-add-item">
            <Plus size={14} className="mr-1" />{addItemMutation.isPending ? "..." : "Adicionar"}
          </Button>
        </div>

        {custoPreview !== null && (
          <p className="text-xs text-muted-foreground mb-4 pl-1">
            Custo estimado: <span className="font-semibold text-foreground">{fmt(custoPreview)}</span>
            {effectiveUnit !== nativeUnit && (
              <span className="ml-1 text-xs">({convertToNativeUnit(parseFloat(addQtd) || 0, effectiveUnit, nativeUnit).toFixed(4).replace(/\.?0+$/, "")} {nativeUnit})</span>
            )}
          </p>
        )}
        {!custoPreview && <div className="mb-4" />}

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
                  <td className="py-2.5 text-right">
                    {editItemId === item.id ? (
                      <input
                        type="number" step="0.001" autoFocus
                        className="w-20 h-7 rounded border border-input bg-background px-2 text-sm text-right outline-none focus:ring-2 focus:ring-ring"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") cancelEdit(); }}
                      />
                    ) : item.quantidade}
                  </td>
                  <td className="py-2.5 pl-2 text-muted-foreground hidden sm:table-cell">
                    {editItemId === item.id ? (() => {
                      const opts = getUnidadesParaInsumo(item.unidade ?? "");
                      return opts.length > 1 ? (
                        <Select value={editUnit || (item.unidade ?? "")} onValueChange={setEditUnit}>
                          <SelectTrigger className="w-16 h-7 text-xs px-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{opts.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <span>{item.unidade ?? "-"}</span>;
                    })() : (item.unidade ?? "-")}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{editItemId === item.id ? "—" : fmt(item.custo_item ?? 0)}</td>
                  <td className="py-2.5">
                    <div className="flex gap-0.5 justify-end">
                      {editItemId === item.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(item)} title="Salvar" disabled={updateItemMutation.isPending}><Check size={12} className="text-green-600" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit} title="Cancelar"><X size={12} /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)} aria-label="Editar quantidade" title="Editar quantidade"><Pencil size={12} className="text-muted-foreground" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(item.id)} data-testid={`button-delete-item-${item.id}`}><Trash2 size={12} className="text-destructive" /></Button>
                        </>
                      )}
                    </div>
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

    </div>
  );
}

interface DraftIngredient { insumo_id: string; quantidade: string; unidade: string; }

function NovaFichaForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const { data: produtos } = useListProdutos();
  const { data: insumos } = useListInsumos();
  const createMutation = useCreateFicha();
  const addItemMutation = useAddFichaItem();

  const [produtoId, setProdutoId] = useState("");
  const [produtoSearch, setProdutoSearch] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [unidadeRendimento, setUnidadeRendimento] = useState("unidades");
  const [observacoes, setObservacoes] = useState("");
  const [ingredientes, setIngredientes] = useState<DraftIngredient[]>([{ insumo_id: "", quantidade: "", unidade: "" }]);
  const [saving, setSaving] = useState(false);

  const produtoSelecionado = produtos?.find(p => p.id === produtoId);
  const categoriaHerdada = produtoSelecionado?.categoria ?? null;

  function addIngrediente() { setIngredientes(prev => [...prev, { insumo_id: "", quantidade: "", unidade: "" }]); }
  function removeIngrediente(i: number) { setIngredientes(prev => prev.filter((_, idx) => idx !== i)); }
  function updateIngrediente(i: number, field: keyof DraftIngredient, val: string) {
    setIngredientes(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      // When the insumo changes, reset the unit selection
      if (field === "insumo_id") return { ...item, insumo_id: val, unidade: "" };
      return { ...item, [field]: val };
    }));
  }

  const cmvPreview = ingredientes.reduce((sum, ing) => {
    const insumo = insumos?.find(ins => ins.id === ing.insumo_id);
    if (!insumo || !ing.quantidade) return sum;
    const nativeUnit = insumo.unidade ?? "";
    const effectiveUnit = ing.unidade || nativeUnit;
    const converted = convertToNativeUnit(parseFloat(ing.quantidade) || 0, effectiveUnit, nativeUnit);
    return sum + converted * Number(insumo.preco_unitario) * Number(insumo.fator_correcao);
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
        const insumo = insumos?.find(ins => ins.id === ing.insumo_id);
        const nativeUnit = insumo?.unidade ?? "";
        const effectiveUnit = ing.unidade || nativeUnit;
        const converted = convertToNativeUnit(parseFloat(ing.quantidade), effectiveUnit, nativeUnit);
        await addItemMutation.mutateAsync({ id: ficha.id, data: { insumo_id: ing.insumo_id, quantidade: converted } });
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
          <Select value={produtoId} onValueChange={v => { setProdutoId(v); setProdutoSearch(""); }} onOpenChange={o => { if (!o) setProdutoSearch(""); }}>
            <SelectTrigger data-testid="select-ficha-produto"><SelectValue placeholder="Selecione o produto..." /></SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5">
                <input
                  className="w-full h-8 px-2 text-sm rounded-md border border-border bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  placeholder="Buscar produto..."
                  value={produtoSearch}
                  onChange={e => setProdutoSearch(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
              {(produtos ?? [])
                .filter(p => p.nome.toLowerCase().includes(produtoSearch.toLowerCase()))
                .map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              {(produtos ?? []).filter(p => p.nome.toLowerCase().includes(produtoSearch.toLowerCase())).length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto encontrado.</div>
              )}
            </SelectContent>
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
          {ingredientes.map((ing, i) => {
            const insumoNativo = insumos?.find(ins => ins.id === ing.insumo_id);
            const nativeUnitDraft = insumoNativo?.unidade ?? "";
            const unitOptionsDraft = nativeUnitDraft ? getUnidadesParaInsumo(nativeUnitDraft) : [];
            const effectiveUnitDraft = ing.unidade || nativeUnitDraft;
            return (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1">
                  <InsumoCombobox insumos={insumos} value={ing.insumo_id} onValueChange={v => updateIngrediente(i, "insumo_id", v)} />
                </div>
                <Input
                  type="number" step="0.001" placeholder="Qtd"
                  className="w-24"
                  value={ing.quantidade}
                  onChange={e => updateIngrediente(i, "quantidade", e.target.value)}
                />
                {unitOptionsDraft.length > 1 ? (
                  <Select value={effectiveUnitDraft} onValueChange={v => updateIngrediente(i, "unidade", v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{unitOptionsDraft.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center px-2 text-sm text-muted-foreground w-16 h-9">{nativeUnitDraft}</div>
                )}
                {ingredientes.length > 1 && (
                  <Button variant="ghost" size="icon" type="button" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeIngrediente(i)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            );
          })}
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
  const { data: assinatura } = useAssinatura();
  const deleteMutation = useDeleteFicha();
  const { data: insumos } = useListInsumos();
  const addItemListMutation = useAddFichaItem();
  const listImportFileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [listImportOpen, setListImportOpen] = useState(false);
  const [listImportRows, setListImportRows] = useState<Array<{nome: string; quantidade: number; valid: boolean; error?: string; resolvedId?: string}>>([]);
  const [listImportFichaId, setListImportFichaId] = useState<string>("");
  const [listImporting, setListImporting] = useState(false);
  const [listImportErrorOpen, setListImportErrorOpen] = useState(false);

  const planLimites = getLimites(assinatura?.planoEfetivo ?? "gratis");
  const planFeatures = getFeatures(assinatura?.planoEfetivo ?? "gratis");

  function handleNovaFicha() {
    if ((data?.length ?? 0) >= planLimites.fichas) {
      setLimiteOpen(true);
      return;
    }
    setShowForm(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Ficha excluída.");
      qc.invalidateQueries({ queryKey: getListFichasQueryKey() });
    } catch { toast.error("Erro ao excluir ficha."); }
    setDeleteId(null);
  }

  function downloadFichaTemplate() {
    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "FFDF20" } },
      font: { bold: true, color: { rgb: "1A1A1A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: "medium", color: { rgb: "C8A800" } } },
      protection: { locked: true },
    };
    // Aba única com todos os campos
    const headers = ["produto", "ingrediente", "quantidade", "unidade", "custo"];
    const wsIng = XLSX.utils.aoa_to_sheet([
      headers,
      ["Bolo de cenoura", "Farinha de trigo", 0.5, "kg", 2.25],
      ["Bolo de cenoura", "Açúcar", 0.2, "kg", 0.90],
      ["Bolo de cenoura", "Ovos", 2, "un", 1.60],
    ]);
    ["A1", "B1", "C1", "D1", "E1"].forEach(ref => { if (wsIng[ref]) wsIng[ref].s = headerStyle; });
    wsIng["!cols"] = [{ wch: 28 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    wsIng["!freeze"] = { xSplit: 0, ySplit: 1 };
    wsIng["!rows"] = [{ hpt: 22 }];
    wsIng["!sheetProtect"] = { selectLockedCells: true, selectUnlockedCells: true };
    // Aba de instruções
    const instRows = [
      ["Coluna", "O que preencher", "Obrigatório?", "Exemplo"],
      ["produto", "Nome do produto vinculado a esta ficha", "Sim", "Bolo de cenoura"],
      ["ingrediente", "Nome exato do insumo cadastrado na plataforma (acentos incluídos)", "Sim", "Farinha de trigo"],
      ["quantidade", "Quantidade usada na receita (na unidade do insumo)", "Sim", "0.5"],
      ["unidade", "Unidade de medida do ingrediente (referência)", "Não", "kg"],
      ["custo", "Custo estimado do ingrediente (referência)", "Não", "2.25"],
      [],
      ["ATENÇÃO: O nome do ingrediente deve ser idêntico ao insumo cadastrado na plataforma."],
      ["Não altere os nomes das colunas. Preencha a partir da linha 2."],
    ];
    const wsInst = XLSX.utils.aoa_to_sheet(instRows);
    wsInst["!cols"] = [{ wch: 18 }, { wch: 58 }, { wch: 14 }, { wch: 22 }];
    const instHeader = {
      fill: { patternType: "solid", fgColor: { rgb: "FFDF20" } },
      font: { bold: true, color: { rgb: "1A1A1A" } },
      alignment: { horizontal: "center" },
    };
    ["A1", "B1", "C1", "D1"].forEach(ref => { if (wsInst[ref]) wsInst[ref].s = instHeader; });
    wsInst["!freeze"] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsIng, "Ingredientes");
    XLSX.utils.book_append_sheet(wb, wsInst, "Instrucoes");
    XLSX.writeFile(wb, "ficha_tecnica_modelo.xlsx");
    toast.success("Planilha modelo baixada!");
  }

  function handleListImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(raw, { type: "array" });
      const sheetName = wb.SheetNames.find(n => n.toLowerCase() === "ingredientes") ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const parsed = rows.map(r => {
        const nome = String(r["ingrediente"] ?? r["nome"] ?? "").trim();
        const qtd = Number(r["quantidade"]);
        const resolved = insumos?.find(i => normalize(i.nome) === normalize(nome));
        if (!nome) return { nome, quantidade: qtd, valid: false, error: "Nome vazio" };
        if (isNaN(qtd) || qtd <= 0) return { nome, quantidade: qtd, valid: false, error: "Quantidade inválida" };
        if (!resolved) return { nome, quantidade: qtd, valid: false, error: "Insumo não cadastrado na plataforma", resolvedId: undefined };
        return { nome, quantidade: qtd, valid: true, resolvedId: resolved.id };
      });
      if (parsed.length === 0) {
        toast.error("Arquivo inválido ou vazio. Use a planilha modelo e tente novamente.");
        return;
      }
      if (parsed.every(r => !r.valid)) {
        setListImportRows(parsed);
        setListImportErrorOpen(true);
        return;
      }
      setListImportRows(parsed);
      setListImportOpen(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function confirmListImport() {
    if (!listImportFichaId) { toast.error("Selecione uma ficha técnica."); return; }
    const valid = listImportRows.filter(r => r.valid && r.resolvedId);
    if (!valid.length) { toast.error("Nenhuma linha válida para importar."); return; }
    setListImporting(true);
    let count = 0;
    for (const row of valid) {
      try {
        await addItemListMutation.mutateAsync({ id: listImportFichaId, data: { insumo_id: row.resolvedId!, quantidade: row.quantidade } });
        count++;
      } catch { /* skip */ }
    }
    setListImporting(false);
    qc.invalidateQueries({ queryKey: getGetFichaQueryKey(listImportFichaId) });
    setListImportOpen(false);
    setListImportRows([]);
    setListImportFichaId("");
    toast.success(`${count} ingredientes importados com sucesso.`);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichas Técnicas</h1>
          <p className="text-sm text-muted-foreground mt-1">Composição e custo de cada receita</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleNovaFicha} data-testid="button-create-ficha"><Plus size={16} className="mr-2" />Nova Ficha</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><FileText size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhuma ficha técnica cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">Crie sua primeira ficha técnica para calcular o CMV das suas receitas</p>
          </div>
          <Button onClick={handleNovaFicha} data-testid="button-empty-create-ficha"><Plus size={16} className="mr-2" />Criar Ficha Técnica</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...data].sort((a, b) => (a.produto_nome ?? "").localeCompare(b.produto_nome ?? "", "pt-BR")).map(ficha => (
            <button
              key={ficha.id}
              onClick={() => setDetailId(ficha.id)}
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group"
              data-testid={`card-ficha-${ficha.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                  <FileText size={16} />
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteId(ficha.id); }}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  data-testid={`button-delete-ficha-${ficha.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="font-semibold text-foreground leading-tight">{ficha.produto_nome ?? "Sem produto"}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Rendimento: <span className="font-medium text-foreground">{ficha.rendimento ?? "-"} {ficha.unidade_rendimento ?? ""}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  CMV: <span className="font-semibold text-primary">{fmt(ficha.cmv_total ?? 0)}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha técnica?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Os dados desta ficha serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        open={limiteOpen}
        onClose={() => setLimiteOpen(false)}
        titulo="Limite de fichas técnicas atingido"
        descricao={`Você atingiu o limite de fichas técnicas do seu plano atual (${planLimites.fichas === Infinity ? "ilimitado" : planLimites.fichas}). Faça upgrade para cadastrar mais fichas técnicas e expandir seu negócio.`}
      />
      <UpgradeModal
        open={featureOpen}
        onClose={() => setFeatureOpen(false)}
        titulo="Recurso disponível nos planos Pro e Premium"
        descricao="Exportar e importar fichas técnicas em Excel está disponível nos planos Pro e Premium."
      />

      {/* List-level Import Dialog */}
      <Dialog open={listImportOpen} onOpenChange={v => { if (!v) { setListImportOpen(false); setListImportRows([]); setListImportFichaId(""); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar ingredientes para ficha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione a ficha técnica de destino *</label>
              <Select value={listImportFichaId} onValueChange={setListImportFichaId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma ficha..." /></SelectTrigger>
                <SelectContent>
                  {[...(data ?? [])].sort((a, b) => (a.produto_nome ?? "").localeCompare(b.produto_nome ?? "", "pt-BR")).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.produto_nome ?? "Sem produto"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {listImportRows.filter(r => r.valid).length} linhas válidas · {listImportRows.filter(r => !r.valid).length} com erros (serão ignoradas)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ingrediente</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Quantidade</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listImportRows.map((r, i) => (
                    <tr key={i} className={r.valid ? "" : "bg-red-50 dark:bg-red-950/20"}>
                      <td className="px-3 py-2">{r.nome || <span className="text-red-500 italic">vazio</span>}</td>
                      <td className="px-3 py-2 text-right">{r.quantidade}</td>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setListImportOpen(false); setListImportRows([]); setListImportFichaId(""); }}>Cancelar</Button>
            <Button onClick={confirmListImport} disabled={listImporting || !listImportRows.some(r => r.valid) || !listImportFichaId}>
              {listImporting ? "Importando..." : `Importar ${listImportRows.filter(r => r.valid).length} ingredientes`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List Import Error Dialog */}
      <Dialog open={listImportErrorOpen} onOpenChange={setListImportErrorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Arquivo com erros</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Seu arquivo possui erros e não pôde ser importado. Revise os campos preenchidos, corrija as informações indicadas e envie novamente.</p>
            <div className="bg-muted rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
              {listImportRows.map((r, i) => (
                <p key={i} className="text-sm text-destructive">• Linha {i + 2}: {r.nome ? `"${r.nome}"` : "(sem nome)"} — {r.error}</p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Dica: o nome do ingrediente deve ser idêntico ao insumo cadastrado na plataforma. Baixe a planilha modelo para ver o formato correto.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListImportErrorOpen(false)}>Fechar</Button>
            <Button onClick={() => { setListImportErrorOpen(false); downloadFichaTemplate(); }}>Baixar modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
