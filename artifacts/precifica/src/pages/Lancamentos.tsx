import { useState, useRef, useEffect, useMemo } from "react";
import { useListLancamentos, useCreateLancamento, useUpdateLancamento, useDeleteLancamento, getListLancamentosQueryKey, useListProdutos } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssinatura } from "@/hooks/useAssinatura";
import { getFeatures } from "@/lib/planConfig";
import { useLocation } from "wouter";
import { Plus, Pencil, Trash2, ArrowRightLeft, TrendingUp, TrendingDown, ChevronDown, X, Search, ChevronLeft, ChevronRight, CalendarDays, Crown, ShoppingCart, SlidersHorizontal } from "lucide-react";
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
    grupo: "Receitas",
    itens: ["Venda de produtos", "Entrega / delivery", "Encomendas", "Eventos e buffet", "Outras receitas"],
  },
  {
    grupo: "Outros",
    itens: ["Seguros em geral", "Despesas eventuais", "Perdas e desperdícios", "Outros não categorizados"],
  },
];

function CategoriaCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(item: string) { onChange(item); setOpen(false); setSearch(""); }
  function clear(e: React.MouseEvent) { e.stopPropagation(); onChange(""); setSearch(""); }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-9"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Selecione uma categoria..."}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && <X size={13} className="text-muted-foreground hover:text-foreground" onClick={clear} />}
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
            {search && <button type="button" onClick={() => setSearch("")}><X size={12} className="text-muted-foreground hover:text-foreground" /></button>}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
            ) : (
              filtered.map(g => (
                <div key={g.grupo}>
                  <p className="sticky top-0 bg-muted/60 px-2 py-1 text-xs font-semibold text-muted-foreground">{g.grupo}</p>
                  {g.itens.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => select(item)}
                      className={`w-full px-4 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground ${value === item ? "bg-accent/60 font-medium" : ""}`}
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
  tipo: z.enum(["receita", "despesa"]),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const today = new Date().toISOString().slice(0, 10);
const defaultValues: FormValues = { descricao: "", tipo: "receita", valor: 0, data: today, categoria: "" };

export default function Lancamentos() {
  const qc = useQueryClient();
  const { data, isLoading } = useListLancamentos();
  const createMutation = useCreateLancamento();
  const updateMutation = useUpdateLancamento();
  const deleteMutation = useDeleteLancamento();
  const { data: assinatura, isLoading: assinaturaLoading } = useAssinatura();
  const [, setLocation] = useLocation();

  const { data: produtos } = useListProdutos();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<"todos" | "receita" | "despesa">("todos");

  // Recurring-entry toggle state (Novo Lançamento modal)
  const [autoLancRecorr, setAutoLancRecorr] = useState(false);
  const [dataRecorr, setDataRecorr] = useState(today);

  // Sale-by-product modal state
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleProdutoId, setSaleProdutoId] = useState("");
  const [saleData, setSaleData] = useState(today);
  const [saleQty, setSaleQty] = useState("");
  const [salePreco, setSalePreco] = useState("");
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleProdutoSearch, setSaleProdutoSearch] = useState("");
  const [saleProdutoDropdown, setSaleProdutoDropdown] = useState(false);
  const saleProdutoRef = useRef<HTMLDivElement>(null);

  const selectedProduto = produtos?.find(p => p.id === saleProdutoId);
  const filteredProdutos = useMemo(() => {
    if (!produtos) return [];
    const q = saleProdutoSearch.toLowerCase();
    return q ? produtos.filter(p => p.nome.toLowerCase().includes(q)) : produtos;
  }, [produtos, saleProdutoSearch]);

  useEffect(() => {
    if (!saleProdutoDropdown) return;
    function onDown(e: MouseEvent) {
      if (saleProdutoRef.current && !saleProdutoRef.current.contains(e.target as Node))
        setSaleProdutoDropdown(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [saleProdutoDropdown]);

  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth()); // 0-indexed

  function prevMonth() {
    if (filterMonth === 0) { setFilterYear(y => y - 1); setFilterMonth(11); }
    else setFilterMonth(m => m - 1);
  }
  function nextMonth() {
    if (filterMonth === 11) { setFilterYear(y => y + 1); setFilterMonth(0); }
    else setFilterMonth(m => m + 1);
  }

  const monthLabel = new Date(filterYear, filterMonth, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthPrefix = `${filterYear}-${String(filterMonth + 1).padStart(2, "0")}`;

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const byMonth = data?.filter(l => l.data.startsWith(monthPrefix)) ?? [];
  const filtered = byMonth.filter(l => filterTipo === "todos" || l.tipo === filterTipo);
  const totalReceita = byMonth.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const totalDespesa = byMonth.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
  const saldo = totalReceita - totalDespesa;

  const features = getFeatures(assinatura?.planoEfetivo ?? "gratis");
  if (!assinaturaLoading && !features.fluxoCaixa) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7A4FB2] to-[#4D2F70] flex items-center justify-center mb-5 mx-auto shadow-lg">
          <Crown size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Fluxo de Caixa</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Registre receitas e despesas, controle seu caixa e veja o saldo do mês. Disponível no plano <strong>Premium</strong>.
        </p>
        <Button
          className="bg-[#7A4FB2] hover:bg-[#6C3FA0] text-white px-8"
          onClick={() => setLocation("/planos")}
        >
          Fazer upgrade para Premium
        </Button>
      </div>
    );
  }

  function openCreate() { setEditingId(null); form.reset(defaultValues); setAutoLancRecorr(false); setDataRecorr(today); setOpen(true); }
  function openEdit(l: NonNullable<typeof data>[0]) {
    setEditingId(l.id);
    form.reset({ descricao: l.descricao, tipo: l.tipo as "receita" | "despesa", valor: l.valor, data: l.data, categoria: l.categoria ?? "" });
    setAutoLancRecorr(false);
    setDataRecorr(today);
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const payload = { ...values, categoria: values.categoria || null };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success("Lançamento atualizado!");
      } else {
        await createMutation.mutateAsync({ data: payload });
        if (autoLancRecorr && dataRecorr) {
          await createMutation.mutateAsync({ data: { ...payload, data: dataRecorr } });
          toast.success("Lançamento registrado e recorrência criada!");
        } else {
          toast.success("Lançamento registrado!");
        }
      }
      qc.invalidateQueries({ queryKey: getListLancamentosQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar lançamento."); }
  }

  function openSaleModal() {
    setSaleProdutoId(""); setSaleData(today); setSaleQty(""); setSalePreco("");
    setSaleProdutoSearch(""); setSaleProdutoDropdown(false);
    setSaleOpen(true);
  }

  function handleSelectSaleProduto(id: string) {
    setSaleProdutoId(id);
    const p = produtos?.find(pp => pp.id === id);
    if (p) setSalePreco(String(p.preco_venda));
    setSaleProdutoDropdown(false);
    setSaleProdutoSearch("");
  }

  async function handleSaleLaunch() {
    if (!saleProdutoId || !saleData || !saleQty) { toast.error("Preencha todos os campos."); return; }
    const qty = parseFloat(saleQty);
    const preco = parseFloat(salePreco);
    if (isNaN(qty) || qty <= 0) { toast.error("Quantidade inválida."); return; }
    if (isNaN(preco) || preco <= 0) { toast.error("Preço inválido."); return; }
    const valor = qty * preco;
    const descricao = `${selectedProduto?.nome ?? "Produto"} × ${qty} un.`;
    setSaleSaving(true);
    try {
      await createMutation.mutateAsync({ data: { descricao, tipo: "receita", valor, data: saleData, categoria: "Venda de produtos" } });
      toast.success("Venda lançada!");
      qc.invalidateQueries({ queryKey: getListLancamentosQueryKey() });
      setSaleOpen(false);
    } catch { toast.error("Erro ao lançar venda."); }
    finally { setSaleSaving(false); }
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
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={openSaleModal} data-testid="button-launch-sale">
            <ShoppingCart size={16} className="mr-2" />Lançar vendas por produto
          </Button>
          <Button onClick={openCreate} data-testid="button-create-lancamento"><Plus size={16} className="mr-2" />Novo Lançamento</Button>
        </div>
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

      {/* Month filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft size={15} />
          </Button>
          <span className="flex items-center gap-1.5 px-2 text-sm font-medium capitalize select-none min-w-[150px] justify-center">
            <CalendarDays size={14} className="text-muted-foreground shrink-0" />
            {monthLabel}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight size={15} />
          </Button>
        </div>

        {/* Tipo filter */}
        <div className="flex gap-2">
          {(["todos", "receita", "despesa"] as const).map(t => (
            <Button key={t} variant={filterTipo === t ? "default" : "outline"} size="sm" onClick={() => setFilterTipo(t)} data-testid={`filter-${t}`} className="capitalize">
              {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
            </Button>
          ))}
        </div>
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
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <CategoriaCombobox value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {!editingId && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoLancRecorr}
                      onClick={() => setAutoLancRecorr(v => !v)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${autoLancRecorr ? "bg-primary" : "bg-input"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${autoLancRecorr ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="text-sm font-medium text-foreground">Lançamento recorrente nesta mesma data</span>
                  </label>
                  {autoLancRecorr && (
                    <div className="flex items-center gap-3 pl-12">
                      <label className="text-sm text-muted-foreground whitespace-nowrap">Data de pagamento:</label>
                      <input
                        type="date"
                        value={dataRecorr}
                        onChange={e => setDataRecorr(e.target.value)}
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                  {autoLancRecorr && (
                    <p className="text-xs text-muted-foreground pl-12">
                      Um lançamento com os mesmos dados será criado na data escolhida.
                    </p>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-lancamento">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Sale by product modal */}
      <Dialog open={saleOpen} onOpenChange={v => { if (!v) setSaleOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Lançar Vendas por Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Product combobox */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Produto *</label>
              <div ref={saleProdutoRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSaleProdutoDropdown(o => !o)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className={selectedProduto ? "text-foreground" : "text-muted-foreground"}>
                    {selectedProduto ? selectedProduto.nome : "Selecione o produto..."}
                  </span>
                  <ChevronDown size={14} className="ml-2 shrink-0 opacity-50" />
                </button>
                {saleProdutoDropdown && (
                  <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md">
                    <div className="p-2 border-b border-border">
                      <input
                        autoFocus
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Buscar produto..."
                        value={saleProdutoSearch}
                        onChange={e => setSaleProdutoSearch(e.target.value)}
                      />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {!filteredProdutos.length ? (
                        <li className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</li>
                      ) : filteredProdutos.map(p => (
                        <li key={p.id} className="flex items-center gap-1 px-2 hover:bg-accent">
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-between py-1.5 text-left text-sm"
                            onClick={() => handleSelectSaleProduto(p.id)}
                          >
                            <span>{p.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">{fmt(p.preco_venda)}/un</span>
                          </button>
                          <button
                            type="button"
                            title="Selecionar e ajustar preço"
                            aria-label={`Ajustar preço de ${p.nome}`}
                            onClick={() => handleSelectSaleProduto(p.id)}
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <SlidersHorizontal size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Date + Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data *</label>
                <Input type="date" value={saleData} onChange={e => setSaleData(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quantidade *</label>
                <Input type="number" step="1" min="1" placeholder="0" value={saleQty} onChange={e => setSaleQty(e.target.value)} />
              </div>
            </div>

            {/* Price (auto-filled from product, editable) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Preço por unidade (R$) *
                <SlidersHorizontal size={12} className="text-muted-foreground" />
              </label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={salePreco} onChange={e => setSalePreco(e.target.value)} />
              {salePreco && saleQty && !isNaN(parseFloat(salePreco)) && !isNaN(parseFloat(saleQty)) && parseFloat(saleQty) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{fmt(parseFloat(salePreco) * parseFloat(saleQty))}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaleOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaleLaunch} disabled={saleSaving}>
              {saleSaving ? "Salvando..." : "Lançar Venda"}
            </Button>
          </DialogFooter>
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
