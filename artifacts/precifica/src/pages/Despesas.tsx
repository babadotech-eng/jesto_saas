import { useState, useRef, useEffect } from "react";
import { useListDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa, getListDespesasQueryKey } from "@workspace/api-client-react";
import { useAssinatura } from "@/hooks/useAssinatura";
import { getLimites } from "@/lib/planConfig";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet, ChevronDown, X, Search } from "lucide-react";
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

const CATEGORIAS = [
  {
    grupo: "Matérias-Primas e Insumos",
    itens: ["Ingredientes e alimentos", "Embalagens e descartáveis", "Temperos e condimentos", "Bebidas e líquidos", "Produtos de panificação e confeitaria"],
  },
  {
    grupo: "Custos de Produção",
    itens: ["Mão de obra direta", "Mão de obra terceirizada", "Gás de cozinha", "Utensílios e pequenos equipamentos", "Manutenção de equipamentos", "Uniformes e EPIs"],
  },
  {
    grupo: "Infraestrutura e Utilidades",
    itens: ["Aluguel do espaço", "Condomínio", "Energia elétrica", "Água e esgoto", "Internet e telefone", "IPTU"],
  },
  {
    grupo: "Vendas e Delivery",
    itens: ["Taxa de aplicativo (iFood, Rappi etc.)", "Taxa de cartão de crédito/débito", "Frete e entrega", "Embalagem para delivery", "Material de divulgação e panfletos"],
  },
  {
    grupo: "Marketing e Digital",
    itens: ["Publicidade nas redes sociais", "Criação de conteúdo", "Fotografia de produtos", "Site e domínio", "E-mail marketing"],
  },
  {
    grupo: "Administrativo e Financeiro",
    itens: ["Contador e escritório contábil", "Taxas bancárias", "IOF e tarifas financeiras", "Software de gestão", "Material de escritório"],
  },
  {
    grupo: "Impostos e Obrigações Legais",
    itens: ["MEI e Simples Nacional", "Alvará e licenças sanitárias", "Vigilância sanitária", "Certificações e registros"],
  },
  {
    grupo: "Pessoal e RH",
    itens: ["Salários e pró-labore", "Férias e 13º", "INSS e encargos", "Vale-transporte e alimentação", "Cursos e capacitações"],
  },
  {
    grupo: "Limpeza e Higiene",
    itens: ["Produtos de limpeza", "Higienização de equipamentos", "Controle de pragas", "Descarte de resíduos"],
  },
  {
    grupo: "Transporte e Logística",
    itens: ["Combustível próprio", "Manutenção de veículo", "Seguro do veículo", "Estacionamento"],
  },
  {
    grupo: "Outros",
    itens: ["Seguros em geral", "Despesas eventuais", "Perdas e desperdícios", "Outros não categorizados"],
  },
];

/* ── Combobox de Categoria com busca ─────────────────────── */
function CategoriaCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const query = search.toLowerCase();
  const filtered = CATEGORIAS
    .map(g => ({
      grupo: g.grupo,
      itens: g.itens.filter(i => i.toLowerCase().includes(query) || g.grupo.toLowerCase().includes(query)),
    }))
    .filter(g => g.itens.length > 0);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(item: string) {
    onChange(item);
    setOpen(false);
    setSearch("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative" data-testid="input-despesa-categoria">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-9"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Selecione uma categoria..."}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <X
              size={13}
              className="text-muted-foreground hover:text-foreground"
              onClick={clear}
            />
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="flex items-center border-b border-border px-2">
            <Search size={13} className="text-muted-foreground mr-1.5 shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={12} className="text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
            ) : (
              filtered.map(g => (
                <div key={g.grupo}>
                  <p className="sticky top-0 bg-muted/60 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {g.grupo}
                  </p>
                  {g.itens.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => select(item)}
                      className={`w-full px-4 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                        value === item ? "bg-accent/60 font-medium" : ""
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const schema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  categoria: z.string().optional(),
  data: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const defaultValues: FormValues = { descricao: "", valor: 0, categoria: "", data: "" };

export default function Despesas() {
  const qc = useQueryClient();
  const { data, isLoading } = useListDespesas();
  const { data: assinatura } = useAssinatura();
  const createMutation = useCreateDespesa();
  const updateMutation = useUpdateDespesa();
  const deleteMutation = useDeleteDespesa();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [limiteOpen, setLimiteOpen] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const total = data?.reduce((sum, d) => sum + d.valor, 0) ?? 0;

  const planLimites = getLimites(assinatura?.plano ?? "gratis");

  function openCreate() {
    if ((data?.length ?? 0) >= planLimites.despesas) {
      setLimiteOpen(true);
      return;
    }
    setEditingId(null);
    form.reset(defaultValues);
    setOpen(true);
  }
  function openEdit(d: NonNullable<typeof data>[0]) {
    setEditingId(d.id);
    form.reset({ descricao: d.descricao, valor: d.valor, categoria: d.categoria ?? "", data: d.data ?? "" });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      categoria: values.categoria || null,
      data: values.data || null,
    };
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...data].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? "")).map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-despesa-${d.id}`}>
                  <td className="px-4 py-3 font-medium">{d.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.categoria ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {d.data ? new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                  </td>
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
                <FormItem><FormLabel>Descrição *</FormLabel><FormControl><Input {...field} placeholder="Ex: Aluguel do espaço" data-testid="input-despesa-descricao" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="valor" render={({ field }) => (
                <FormItem><FormLabel>Valor (R$) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} data-testid="input-despesa-valor" /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="data" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-despesa-data" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Categoria com busca */}
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <CategoriaCombobox value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

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

      <UpgradeModal
        open={limiteOpen}
        onClose={() => setLimiteOpen(false)}
        titulo="Limite de despesas atingido"
        descricao={`Você atingiu o limite de ${planLimites.despesas} despesas fixas do seu plano atual. Faça upgrade para continuar cadastrando despesas e ter um controle financeiro completo.`}
      />
    </div>
  );
}
