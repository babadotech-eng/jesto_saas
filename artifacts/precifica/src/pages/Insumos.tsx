import { useState } from "react";
import { useListInsumos, useCreateInsumo, useUpdateInsumo, useDeleteInsumo, getListInsumosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Carrot } from "lucide-react";
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
  nome: z.string().min(1, "Nome é obrigatório"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  preco_unitario: z.coerce.number().min(0),
  fator_correcao: z.coerce.number().min(0.01).default(1),
});
type FormValues = z.infer<typeof schema>;
const defaultValues: FormValues = { nome: "", unidade: "kg", preco_unitario: 0, fator_correcao: 1 };

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

  return (
    <div className="space-y-6" data-testid="insumos-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insumos</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingredientes e matérias-primas</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-insumo"><Plus size={16} className="mr-2" />Novo Insumo</Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Insumo" : "Novo Insumo"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} data-testid="input-insumo-nome" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="unidade" render={({ field }) => (
                <FormItem><FormLabel>Unidade *</FormLabel><FormControl><Input {...field} placeholder="kg, g, L, mL, un" data-testid="input-insumo-unidade" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="preco_unitario" render={({ field }) => (
                  <FormItem><FormLabel>Preço/unid. (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-insumo-preco" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fator_correcao" render={({ field }) => (
                  <FormItem><FormLabel>Fator Correção</FormLabel><FormControl><Input type="number" step="0.001" {...field} data-testid="input-insumo-fator" /></FormControl><FormMessage /></FormItem>
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
