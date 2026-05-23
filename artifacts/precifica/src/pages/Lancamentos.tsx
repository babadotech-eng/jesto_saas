import { useState } from "react";
import { useListLancamentos, useCreateLancamento, useUpdateLancamento, useDeleteLancamento, getListLancamentosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const schema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipo: z.enum(["receita", "despesa"]),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
});
type FormValues = z.infer<typeof schema>;
const today = new Date().toISOString().slice(0, 10);
const defaultValues: FormValues = { descricao: "", tipo: "receita", valor: 0, data: today };

export default function Lancamentos() {
  const qc = useQueryClient();
  const { data, isLoading } = useListLancamentos();
  const createMutation = useCreateLancamento();
  const updateMutation = useUpdateLancamento();
  const deleteMutation = useDeleteLancamento();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<"todos" | "receita" | "despesa">("todos");

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const filtered = data?.filter(l => filterTipo === "todos" || l.tipo === filterTipo) ?? [];
  const totalReceita = data?.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0) ?? 0;
  const totalDespesa = data?.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0) ?? 0;
  const saldo = totalReceita - totalDespesa;

  function openCreate() { setEditingId(null); form.reset(defaultValues); setOpen(true); }
  function openEdit(l: NonNullable<typeof data>[0]) {
    setEditingId(l.id);
    form.reset({ descricao: l.descricao, tipo: l.tipo as "receita" | "despesa", valor: l.valor, data: l.data });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
        toast.success("Lançamento atualizado!");
      } else {
        await createMutation.mutateAsync({ data: values });
        toast.success("Lançamento registrado!");
      }
      qc.invalidateQueries({ queryKey: getListLancamentosQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar lançamento."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Lançamento excluído.");
      qc.invalidateQueries({ queryKey: getListLancamentosQueryKey() });
    } catch { toast.error("Erro ao excluir."); }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6" data-testid="lancamentos-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Fluxo de caixa do seu negócio</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-lancamento"><Plus size={16} className="mr-2" />Novo Lançamento</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><TrendingUp size={18} /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Receitas</p>
            <p className="font-bold text-green-600" data-testid="total-receitas">{fmt(totalReceita)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><TrendingDown size={18} /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Despesas</p>
            <p className="font-bold text-red-600" data-testid="total-despesas-lanc">{fmt(totalDespesa)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${saldo >= 0 ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"}`}><ArrowRightLeft size={18} /></div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-bold ${saldo >= 0 ? "text-primary" : "text-red-600"}`} data-testid="saldo-lancamentos">{fmt(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["todos", "receita", "despesa"] as const).map(t => (
          <Button key={t} variant={filterTipo === t ? "default" : "outline"} size="sm" onClick={() => setFilterTipo(t)} data-testid={`filter-${t}`} className="capitalize">
            {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><ArrowRightLeft size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhum lançamento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Registre suas entradas e saídas</p>
          </div>
          <Button onClick={openCreate} data-testid="button-empty-create-lancamento"><Plus size={16} className="mr-2" />Novo Lançamento</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-lancamento-${l.id}`}>
                  <td className="px-4 py-3 font-medium">{l.descricao}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={l.tipo === "receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {l.tipo === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${l.tipo === "receita" ? "text-green-600" : "text-red-600"}`}>
                    {l.tipo === "receita" ? "+" : "-"}{fmt(l.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)} data-testid={`button-edit-lancamento-${l.id}`}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(l.id)} data-testid={`button-delete-lancamento-${l.id}`}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem><FormLabel>Descrição *</FormLabel><FormControl><Input {...field} placeholder="Ex: Venda bolo, Compra farinha" data-testid="input-lancamento-descricao" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem><FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-lancamento-tipo"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="data" render={({ field }) => (
                  <FormItem><FormLabel>Data *</FormLabel><FormControl><Input type="date" {...field} data-testid="input-lancamento-data" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="valor" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-lancamento-valor" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-lancamento">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
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
