import { useState } from "react";
import { useListFichas, useCreateFicha, useDeleteFicha, useGetFicha, useAddFichaItem, useDeleteFichaItem, useListProdutos, useListInsumos, getListFichasQueryKey, getGetFichaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const fichaSchema = z.object({ produto_id: z.string().min(1, "Selecione um produto"), rendimento: z.coerce.number().optional(), unidade_rendimento: z.string().optional() });
const itemSchema = z.object({ insumo_id: z.string().min(1, "Selecione um insumo"), quantidade: z.coerce.number().min(0.001, "Informe a quantidade") });
type FichaForm = z.infer<typeof fichaSchema>;
type ItemForm = z.infer<typeof itemSchema>;

function FichaDetail({ fichaId, onBack }: { fichaId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { data: ficha, isLoading } = useGetFicha(fichaId, { query: { enabled: !!fichaId, queryKey: getGetFichaQueryKey(fichaId) } });
  const { data: insumos } = useListInsumos();
  const addItemMutation = useAddFichaItem();
  const deleteItemMutation = useDeleteFichaItem();
  const [addOpen, setAddOpen] = useState(false);

  const form = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues: { insumo_id: "", quantidade: 0 } });

  async function onAddItem(values: ItemForm) {
    try {
      await addItemMutation.mutateAsync({ id: fichaId, data: values });
      toast.success("Ingrediente adicionado!");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
      setAddOpen(false);
      form.reset();
    } catch { toast.error("Erro ao adicionar ingrediente."); }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await deleteItemMutation.mutateAsync({ id: fichaId, itemId });
      toast.success("Ingrediente removido.");
      qc.invalidateQueries({ queryKey: getGetFichaQueryKey(fichaId) });
    } catch { toast.error("Erro ao remover ingrediente."); }
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!ficha) return <div className="text-center py-8 text-muted-foreground">Ficha não encontrada.</div>;

  return (
    <div className="space-y-6" data-testid="ficha-detail">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-ficha"><ArrowLeft size={18} /></Button>
        <div>
          <h2 className="text-xl font-bold">{ficha.produto_nome ?? "Ficha Técnica"}</h2>
          <p className="text-sm text-muted-foreground">Custo total: <span className="font-semibold text-foreground">{fmt(ficha.cmv_total ?? 0)}</span></p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Ingredientes</h3>
          <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-item"><Plus size={14} className="mr-1" />Adicionar</Button>
        </div>
        {!ficha.itens?.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum ingrediente adicionado ainda.<br />Clique em "Adicionar" para começar.
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Ingrediente</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddItem)} className="space-y-4">
              <FormField control={form.control} name="insumo_id" render={({ field }) => (
                <FormItem><FormLabel>Ingrediente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-item-insumo"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent>{insumos?.map(i => <SelectItem key={i.id} value={i.id}>{i.nome} ({i.unidade})</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quantidade" render={({ field }) => (
                <FormItem><FormLabel>Quantidade *</FormLabel><FormControl><Input type="number" step="0.001" {...field} data-testid="input-item-quantidade" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={addItemMutation.isPending} data-testid="button-submit-item">Adicionar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FichaTecnica() {
  const qc = useQueryClient();
  const { data, isLoading } = useListFichas();
  const { data: produtos } = useListProdutos();
  const createMutation = useCreateFicha();
  const deleteMutation = useDeleteFicha();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const form = useForm<FichaForm>({ resolver: zodResolver(fichaSchema), defaultValues: { produto_id: "", rendimento: undefined, unidade_rendimento: "" } });

  async function onSubmit(values: FichaForm) {
    try {
      await createMutation.mutateAsync({ data: { produto_id: values.produto_id, rendimento: values.rendimento ?? null, unidade_rendimento: values.unidade_rendimento || null } });
      toast.success("Ficha técnica criada!");
      qc.invalidateQueries({ queryKey: getListFichasQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao criar ficha técnica."); }
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

  if (detailId) return <FichaDetail fichaId={detailId} onBack={() => setDetailId(null)} />;

  return (
    <div className="space-y-6" data-testid="ficha-tecnica-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichas Técnicas</h1>
          <p className="text-sm text-muted-foreground mt-1">Composição e custo de cada receita</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-create-ficha"><Plus size={16} className="mr-2" />Nova Ficha</Button>
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
          <Button onClick={() => setOpen(true)} data-testid="button-empty-create-ficha"><Plus size={16} className="mr-2" />Criar Ficha Técnica</Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Ficha Técnica</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="produto_id" render={({ field }) => (
                <FormItem><FormLabel>Produto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-ficha-produto"><SelectValue placeholder="Selecione o produto..." /></SelectTrigger></FormControl>
                    <SelectContent>{produtos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="rendimento" render={({ field }) => (
                  <FormItem><FormLabel>Rendimento</FormLabel><FormControl><Input type="number" step="0.001" {...field} placeholder="Ex: 12" data-testid="input-ficha-rendimento" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="unidade_rendimento" render={({ field }) => (
                  <FormItem><FormLabel>Unidade</FormLabel><FormControl><Input {...field} placeholder="Ex: unidades, fatias" data-testid="input-ficha-unidade" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-ficha">Criar Ficha</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
