import { useState } from "react";
import {
  useListFuncionarios, useCreateFuncionario, useUpdateFuncionario, useDeleteFuncionario,
  getListFuncionariosQueryKey,
  type Funcionario as FuncionarioRow,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAssinatura } from "@/hooks/useAssinatura";
import { useLocation } from "wouter";
import { Plus, Pencil, Trash2, Users, Crown, DollarSign, Calculator, TrendingUp, ExternalLink, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

const TIPOS_CONTRATACAO = ["CLT", "Estágio", "PJ"];

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  salario: z.coerce.number().min(0),
  setor: z.string().optional(),
  cargo: z.string().optional(),
  tipo_contratacao: z.string().min(1),
  data_inicio: z.string().optional(),
  vale_transporte: z.coerce.number().min(0).default(0),
  vale_refeicao: z.coerce.number().min(0).default(0),
  convenio_medico: z.coerce.number().min(0).default(0),
  carga_horaria_mensal: z.coerce.number().min(0).default(220),
  provisao_ferias_pct: z.coerce.number().min(0).default(11.11),
  provisao_terco_ferias_pct: z.coerce.number().min(0).default(3.70),
  provisao_decimo_terceiro_pct: z.coerce.number().min(0).default(8.33),
  provisao_decimo_terceiro_ferias_pct: z.coerce.number().min(0).default(1.03),
  inss_patronal_pct: z.coerce.number().min(0).default(20),
  sat_rat_pct: z.coerce.number().min(0).default(1),
  salario_educacao_pct: z.coerce.number().min(0).default(2.5),
  sistema_s_pct: z.coerce.number().min(0).default(3.3),
  fgts_pct: z.coerce.number().min(0).default(8),
  fgts_rescisao_pct: z.coerce.number().min(0).default(4),
});
type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  nome: "", salario: 0, setor: "", cargo: "", tipo_contratacao: "CLT", data_inicio: "",
  vale_transporte: 0, vale_refeicao: 0, convenio_medico: 0, carga_horaria_mensal: 220,
  provisao_ferias_pct: 11.11, provisao_terco_ferias_pct: 3.70,
  provisao_decimo_terceiro_pct: 8.33, provisao_decimo_terceiro_ferias_pct: 1.03,
  inss_patronal_pct: 20, sat_rat_pct: 1, salario_educacao_pct: 2.5,
  sistema_s_pct: 3.3, fgts_pct: 8, fgts_rescisao_pct: 4,
};

function PremiumGate() {
  const [, setLocation] = useLocation();
  return (
    <div className="max-w-xl mx-auto mt-12 bg-card border border-border rounded-2xl p-10 shadow-sm text-center" data-testid="premium-gate">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
        <Crown size={32} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Funcionários</h2>
      <p className="text-muted-foreground mb-6">Este módulo está disponível apenas no plano Premium.</p>
      <Button size="lg" onClick={() => setLocation("/planos")} className="bg-[#FF6C3A] hover:bg-[#E8542A] active:bg-[#D43D15] text-white" data-testid="button-upgrade-premium">
        Fazer upgrade para Premium
      </Button>
    </div>
  );
}

function CalculosLive({ control }: { control: any }) {
  const v = useWatch({ control });
  const trabPct = (Number(v.provisao_ferias_pct) || 0) + (Number(v.provisao_terco_ferias_pct) || 0) + (Number(v.provisao_decimo_terceiro_pct) || 0) + (Number(v.provisao_decimo_terceiro_ferias_pct) || 0);
  const sociaisPct = (Number(v.inss_patronal_pct) || 0) + (Number(v.sat_rat_pct) || 0) + (Number(v.salario_educacao_pct) || 0) + (Number(v.sistema_s_pct) || 0) + (Number(v.fgts_pct) || 0) + (Number(v.fgts_rescisao_pct) || 0);
  const totalPct = trabPct + sociaisPct;
  const salario = Number(v.salario) || 0;
  const carga = Number(v.carga_horaria_mensal) > 0 ? Number(v.carga_horaria_mensal) : 220;
  const valorEncargos = salario * totalPct / 100;
  const totalMensal = salario + valorEncargos + (Number(v.vale_transporte) || 0) + (Number(v.vale_refeicao) || 0) + (Number(v.convenio_medico) || 0);
  const valorHora = totalMensal / carga;
  return { trabPct, sociaisPct, totalPct, totalMensal, valorHora };
}

function NumberField({ control, name, label }: { control: any; name: keyof FormValues; label: string }) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type="number" step="0.01" {...field} data-testid={`input-func-${name}`} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function ReadOnlyField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50 border border-border"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

export default function Funcionarios() {
  const qc = useQueryClient();
  const { data: assinatura, isLoading: loadingAssinatura } = useAssinatura();
  const isPremium = assinatura?.plano === "premium";

  const { data, isLoading } = useListFuncionarios({ query: { enabled: isPremium, queryKey: getListFuncionariosQueryKey() } });
  const createMutation = useCreateFuncionario();
  const updateMutation = useUpdateFuncionario();
  const deleteMutation = useDeleteFuncionario();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const calc = CalculosLive({ control: form.control });

  if (loadingAssinatura) {
    return <div className="space-y-4"><Skeleton className="h-32" /></div>;
  }
  if (!isPremium) return <PremiumGate />;

  function openCreate() {
    setEditingId(null);
    form.reset(defaultValues);
    setOpen(true);
  }
  function openEdit(f: FuncionarioRow) {
    setEditingId(f.id);
    form.reset({
      ...defaultValues,
      nome: f.nome,
      salario: f.salario,
      setor: f.setor ?? "",
      cargo: f.cargo ?? "",
      tipo_contratacao: f.tipo_contratacao,
      data_inicio: f.data_inicio ?? "",
      vale_transporte: f.vale_transporte ?? 0,
      vale_refeicao: f.vale_refeicao ?? 0,
      convenio_medico: f.convenio_medico ?? 0,
      carga_horaria_mensal: f.carga_horaria_mensal ?? 220,
      provisao_ferias_pct: f.provisao_ferias_pct ?? 11.11,
      provisao_terco_ferias_pct: f.provisao_terco_ferias_pct ?? 3.70,
      provisao_decimo_terceiro_pct: f.provisao_decimo_terceiro_pct ?? 8.33,
      provisao_decimo_terceiro_ferias_pct: f.provisao_decimo_terceiro_ferias_pct ?? 1.03,
      inss_patronal_pct: f.inss_patronal_pct ?? 20,
      sat_rat_pct: f.sat_rat_pct ?? 1,
      salario_educacao_pct: f.salario_educacao_pct ?? 2.5,
      sistema_s_pct: f.sistema_s_pct ?? 3.3,
      fgts_pct: f.fgts_pct ?? 8,
      fgts_rescisao_pct: f.fgts_rescisao_pct ?? 4,
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      setor: values.setor || null,
      cargo: values.cargo || null,
      data_inicio: values.data_inicio || null,
      carga_horaria_mensal: Number(values.carga_horaria_mensal) > 0 ? values.carga_horaria_mensal : 220,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success("Funcionário atualizado!");
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success("Funcionário cadastrado!");
      }
      qc.invalidateQueries({ queryKey: getListFuncionariosQueryKey() });
      setOpen(false);
    } catch { toast.error("Erro ao salvar funcionário."); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Funcionário excluído.");
      qc.invalidateQueries({ queryKey: getListFuncionariosQueryKey() });
    } catch { toast.error("Erro ao excluir."); }
    setDeleteId(null);
  }

  const totalFolha = data?.reduce((s, f) => s + (f.total_mensal ?? 0), 0) ?? 0;
  const totalEncargos = data?.reduce((s, f) => s + (f.valor_encargos ?? 0), 0) ?? 0;
  const custoMedio = data && data.length > 0 ? totalFolha / data.length : 0;
  const valorHoraMedio = data && data.length > 0 ? data.reduce((s, f) => s + (f.valor_hora ?? 0), 0) / data.length : 0;

  return (
    <div className="space-y-6" data-testid="funcionarios-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground mt-1">Folha de pagamento e encargos</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-funcionario">
          <Plus size={16} className="mr-2" />Novo Funcionário
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><DollarSign size={14} /> Total da folha mensal</div>
          <p className="text-xl font-bold text-foreground" data-testid="kpi-total-folha">{fmt(totalFolha)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><Calculator size={14} /> Total de encargos</div>
          <p className="text-xl font-bold text-foreground">{fmt(totalEncargos)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><Users size={14} /> Custo médio / funcionário</div>
          <p className="text-xl font-bold text-foreground">{fmt(custoMedio)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2"><TrendingUp size={14} /> Valor/hora médio</div>
          <p className="text-xl font-bold text-foreground">{fmt(valorHoraMedio)}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Users size={24} className="text-muted-foreground" /></div>
          <div className="text-center">
            <p className="font-semibold">Nenhum funcionário cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Comece adicionando seu primeiro colaborador</p>
          </div>
          <Button onClick={openCreate} data-testid="button-empty-create-funcionario"><Plus size={16} className="mr-2" />Cadastrar Funcionário</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Cargo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Setor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Contratação</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Salário</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Encargos %</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total mensal</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Valor/hora</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(f => (
                <tr key={f.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-funcionario-${f.id}`}>
                  <td className="px-4 py-3 font-medium">{f.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.cargo ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.setor ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{f.tipo_contratacao}</td>
                  <td className="px-4 py-3 text-right">{fmt(f.salario)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{fmtPct(f.encargos_totais_pct ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(f.total_mensal ?? 0)}</td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">{fmt(f.valor_hora ?? 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(f)} data-testid={`button-edit-funcionario-${f.id}`}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)} data-testid={`button-delete-funcionario-${f.id}`}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border">
              <tr>
                <td colSpan={6} className="px-4 py-3 font-semibold">Total geral da folha</td>
                <td className="px-4 py-3 text-right font-bold text-primary">{fmt(totalFolha)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Info block */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-2">Consulte alíquotas e tabelas oficiais atualizadas em:</p>
        <ul className="space-y-1 mb-3">
          <li><a href="https://www.gov.br/esocial/pt-br" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">gov.br/esocial <ExternalLink size={12} /></a></li>
          <li><a href="https://frontend.esocial.gov.br/adm/" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">frontend.esocial.gov.br/adm <ExternalLink size={12} /></a></li>
        </ul>
        <p className="text-xs">As alíquotas podem variar conforme regime tributário, CNAE, grau de risco e tipo de contratação. Por isso, os campos são editáveis.</p>
      </div>

      {/* Dialog form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados pessoais */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Dados do funcionário</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Nome *</FormLabel><FormControl><Input {...field} data-testid="input-func-nome" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <NumberField control={form.control} name="salario" label="Salário (R$) *" />
                  <FormField control={form.control} name="tipo_contratacao" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contratação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="input-func-tipo"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{TIPOS_CONTRATACAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="setor" render={({ field }) => (
                    <FormItem><FormLabel>Setor</FormLabel><FormControl><Input {...field} placeholder="Ex: Cozinha" data-testid="input-func-setor" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cargo" render={({ field }) => (
                    <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} placeholder="Ex: Auxiliar" data-testid="input-func-cargo" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="data_inicio" render={({ field }) => (
                    <FormItem><FormLabel>Data de início</FormLabel><FormControl><Input type="date" {...field} data-testid="input-func-data_inicio" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <NumberField control={form.control} name="vale_transporte" label="Vale transporte (R$)" />
                  <FormField control={form.control} name="vale_refeicao" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        Vale refeição (R$)
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                              <HelpCircle size={13} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="text-xs max-w-xs" side="top">
                            Se o funcionário se alimenta na empresa, adicione aqui o custo relacionado à refeição individual ou mensal. Este valor entra no custo total do funcionário.
                          </PopoverContent>
                        </Popover>
                      </FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} data-testid="input-func-vale_refeicao" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <NumberField control={form.control} name="convenio_medico" label="Convênio médico (R$)" />
                  <NumberField control={form.control} name="carga_horaria_mensal" label="Carga horária mensal (h)" />
                </div>
              </div>

              {/* Encargos trabalhistas */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Encargos trabalhistas</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <NumberField control={form.control} name="provisao_ferias_pct" label="Provisão Férias +1/3 (%)" />
                  <NumberField control={form.control} name="provisao_terco_ferias_pct" label="Provisão 1/3 de Férias (%)" />
                  <NumberField control={form.control} name="provisao_decimo_terceiro_pct" label="Provisão 13º salário (%)" />
                  <NumberField control={form.control} name="provisao_decimo_terceiro_ferias_pct" label="Provisão 13º sobre férias (%)" />
                  <div className="sm:col-span-2">
                    <ReadOnlyField label="Total Encargos Trabalhistas" value={fmtPct(calc.trabPct)} />
                  </div>
                </div>
              </div>

              {/* Encargos sociais */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Encargos sociais</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <NumberField control={form.control} name="inss_patronal_pct" label="INSS Patronal (%)" />
                  <NumberField control={form.control} name="sat_rat_pct" label="SAT/RAT (%)" />
                  <NumberField control={form.control} name="salario_educacao_pct" label="Salário Educação (%)" />
                  <NumberField control={form.control} name="sistema_s_pct" label="INCRA/SEST/SEBRAE/SENAT (%)" />
                  <NumberField control={form.control} name="fgts_pct" label="FGTS (%)" />
                  <NumberField control={form.control} name="fgts_rescisao_pct" label="FGTS + Provisão Rescisão (%)" />
                  <div className="sm:col-span-2">
                    <ReadOnlyField label="Total Encargos Sociais" value={fmtPct(calc.sociaisPct)} />
                  </div>
                </div>
              </div>

              {/* Total geral */}
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Total geral</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <ReadOnlyField label="Total Geral dos Encargos" value={fmtPct(calc.totalPct)} />
                  <ReadOnlyField label="Total Mensal" value={fmt(calc.totalMensal)} highlight />
                  <ReadOnlyField label="Valor/Hora" value={fmt(calc.valorHora)} highlight />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-funcionario">
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
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
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
