import { useState, useRef } from "react";
import { useListInsumos, useCreateInsumo, useUpdateInsumo, useDeleteInsumo, getListInsumosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Carrot, HelpCircle, Download, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const UNIDADES = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g (grama)" },
  { value: "L", label: "L (litro)" },
  { value: "ml", label: "ml" },
  { value: "unid", label: "unid (unidade)" },
  { value: "cx", label: "cx (caixa)" },
  { value: "pct", label: "pct (pacote)" },
  { value: "dz", label: "dz (dúzia)" },
];

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  preco_unitario: z.coerce.number().min(0),
  fator_correcao: z.coerce.number().min(0.01).default(1),
});
type FormValues = z.infer<typeof schema>;
const defaultValues: FormValues = { nome: "", unidade: "kg", preco_unitario: 0, fator_correcao: 1 };

interface ImportRow { nome: string; unidade: string; preco_unitario: number; fator_correcao: number; valid: boolean; error?: string; }

export default function Insumos() {
  const qc = useQueryClient();
  const { data, isLoading } = useListInsumos();
  const createMutation = useCreateInsumo();
  const updateMutation = useUpdateInsumo();
  const deleteMutation = useDeleteInsumo();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const filtered = data?.filter(i => i.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  function openCreate() { setEditingId(null); form.reset(defaultValues); setOpen(true); }
  function openEdit(item: NonNullable<typeof data>[0]) {
    setEditingId(item.id);
    form.reset({ nome: item.nome, unidade: item.unidade, preco_unitario: item.preco_unitario, fator_correcao: item.fator_correcao });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
        toast.success("Insumo atualizado!");
      } else {
        await createMutation.mutateAsync({ data: values });
        toast.success("Insumo cadastrado!");
      }
      qc.invalidateQueries({ queryKey: getListInsumosQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar insumo."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Insumo excluído.");
      qc.invalidateQueries({ queryKey: getListInsumosQueryKey() });
    } catch { toast.error("Erro ao excluir insumo."); }
    setDeleteId(null);
  }

  // ── Excel template download ──────────────────────────────────────────────
  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["nome", "unidade", "preco_unitario", "fator_correcao"],
      ["Farinha de trigo", "kg", 4.5, 1],
      ["Ovos", "dz", 12.0, 1],
      ["Frango", "kg", 18.9, 1.33],
    ]);
    ws["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insumos");
    XLSX.writeFile(wb, "insumos_modelo.xlsx");
    toast.success("Planilha modelo baixada!");
  }

  // ── Excel import parse ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      const parsed: ImportRow[] = rows.map(r => {
        const nome = String(r["nome"] ?? "").trim();
        const unidade = String(r["unidade"] ?? "kg").trim() || "kg";
        const preco = Number(r["preco_unitario"]);
        const fator = Number(r["fator_correcao"] ?? 1) || 1;
        if (!nome) return { nome, unidade, preco_unitario: preco, fator_correcao: fator, valid: false, error: "Nome obrigatório" };
        if (isNaN(preco) || preco < 0) return { nome, unidade, preco_unitario: preco, fator_correcao: fator, valid: false, error: "Preço inválido" };
        return { nome, unidade, preco_unitario: preco, fator_correcao: fator, valid: true };
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
        await createMutation.mutateAsync({ data: { nome: row.nome, unidade: row.unidade, preco_unitario: row.preco_unitario, fator_correcao: row.fator_correcao } });
        successCount++;
      } catch { /* count error */ }
    }
    setImporting(false);
    qc.invalidateQueries({ queryKey: getListInsumosQueryKey() });
    setImportOpen(false);
    setImportRows([]);
    toast.success(`${successCount} insumos importados com sucesso.${errors > 0 ? ` ${errors} erros ignorados.` : ""}`);
  }

  return (
    <div className="space-y-6" data-testid="insumos-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insumos</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingredientes e matérias-primas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
            <Download size={14} />Baixar planilha modelo
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <Upload size={14} />Importar Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          <Button onClick={openCreate} data-testid="button-create-insumo"><Plus size={16} className="mr-2" />Novo Insumo</Button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar insumo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-insumos" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Carrot size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhum insumo encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastre os ingredientes das suas receitas</p>
          </div>
          <Button onClick={openCreate} data-testid="button-empty-create-insumo"><Plus size={16} className="mr-2" />Cadastrar Insumo</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unidade</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Preço/unid.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fator Correção</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-insumo-${i.id}`}>
                  <td className="px-4 py-3 font-medium">{i.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.unidade}</td>
                  <td className="px-4 py-3 text-right">{fmt(i.preco_unitario)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{Number(i.fator_correcao).toFixed(3)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)} data-testid={`button-edit-insumo-${i.id}`}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(i.id)} data-testid={`button-delete-insumo-${i.id}`}><Trash2 size={14} className="text-destructive" /></Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Insumo" : "Novo Insumo"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} data-testid="input-insumo-nome" /></FormControl><FormMessage /></FormItem>
              )} />

              {/* Unidade — select */}
              <FormField control={form.control} name="unidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="input-insumo-unidade">
                        <SelectValue placeholder="Selecione a unidade..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="preco_unitario" render={({ field }) => (
                  <FormItem><FormLabel>Preço/unid. (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-insumo-preco" /></FormControl><FormMessage /></FormItem>
                )} />

                {/* Fator de correção with tooltip */}
                <FormField control={form.control} name="fator_correcao" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Fator Correção
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle size={14} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 text-sm" side="top">
                          <p className="font-semibold mb-1">O que é fator de correção?</p>
                          <p className="text-muted-foreground">
                            Representa a perda do insumo no preparo. Por exemplo: 1 kg de frango comprado pode render apenas 0,75 kg após limpar. Nesse caso, o fator seria <strong>1,33</strong> (1 ÷ 0,75). Se não houver perda, use <strong>1</strong>.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <FormControl><Input type="number" step="0.001" {...field} data-testid="input-insumo-fator" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-insumo">
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importOpen} onOpenChange={v => { if (!v) { setImportOpen(false); setImportRows([]); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia da Importação</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            {importRows.filter(r => r.valid).length} linhas válidas · {importRows.filter(r => !r.valid).length} com erros (serão ignoradas)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Unid.</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Preço</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Fator</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importRows.map((r, i) => (
                  <tr key={i} className={r.valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-2">{r.nome || <span className="text-red-500 italic">vazio</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.unidade}</td>
                    <td className="px-3 py-2 text-right">{fmt(r.preco_unitario)}</td>
                    <td className="px-3 py-2 text-right">{r.fator_correcao}</td>
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
              {importing ? "Importando..." : `Importar ${importRows.filter(r => r.valid).length} insumos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir insumo?</AlertDialogTitle>
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
