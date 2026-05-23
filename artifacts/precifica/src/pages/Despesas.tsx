import { useState } from "react";
import { useListDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa, getListDespesasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  categoria: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const defaultValues: FormValues = { descricao: "", valor: 0, categoria: "" };

export default function Despesas() {
  const qc = useQueryClient();
  const { data, isLoading } = useListDespesas();
  const createMutation = useCreateDespesa();
  const updateMutation = useUpdateDespesa();
  const deleteMutation = useDeleteDespesa();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const total = data?.reduce((sum, d) => sum + d.valor, 0) ?? 0;

  function openCreate() { setEditingId(null); form.reset(defaultValues); setOpen(true); }
  function openEdit(d: NonNullable<typeof data>[0]) {
    setEditingId(d.id);
    form.reset({ descricao: d.descricao, valor: d.valor, categoria: d.categoria ?? "" });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, categoria: values.categoria || null };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success("Despesa atualizada!");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Despesa cadastrada!");
      }
      qc.invalidateQueries({ queryKey: getListDespesasQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar despesa."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Despesa excluída.");
      qc.invalidateQueries({ queryKey: getListDespesasQueryKey() });
    } catch { toast.error("Erro ao excluir despesa."); }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6" data-testid="despesas-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas Fixas</h1>
          <p className="text-sm text-muted-foreground mt-1">Custos fixos mensais do seu negócio</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-despesa"><Plus size={16} className="mr-2" />Nova Despesa</Button>
      </div>

      {/* Total card */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Wallet size={22} /></div>
        <div>
          <p className="text-sm text-muted-foreground">Total de Despesas Fixas</p>
          <p className="text-2xl font-bold text-foreground" data-testid="total-despesas">{fmt(total)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Wallet size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhuma despesa cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione seus custos fixos mensais</p>
          </div>
          <Button onClick={openCreate} data-testid="button-empty-create-despesa"><Plus size={16} className="mr-2" />Adicionar Despesa</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-despesa-${d.id}`}>
                  <td className="px-4 py-3 font-medium">{d.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.categoria ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{fmt(d.valor)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)} data-testid={`button-edit-despesa-${d.id}`}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)} data-testid={`button-delete-despesa-${d.id}`}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-semibold text-sm">Total</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem><FormLabel>Descrição *</FormLabel><FormControl><Input {...field} placeholder="Ex: Aluguel, Energia, Internet" data-testid="input-despesa-descricao" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valor" render={({ field }) => (
                  <FormItem><FormLabel>Valor (R$) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-despesa-valor" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} placeholder="Ex: Aluguel, Utilidades" data-testid="input-despesa-categoria" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-despesa">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
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
