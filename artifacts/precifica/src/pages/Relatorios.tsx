import { useState } from "react";
import { useGetTopProdutos, useGetAlertasMargem, useGetFluxoSemanal, useGetPontoEquilibrio, useListProdutos, useGetDashboardSummary } from "@workspace/api-client-react";
import { useAssinatura } from "@/hooks/useAssinatura";
import { planAtLeast } from "@/lib/planConfig";
import { TrendingUp, AlertTriangle, Target, Sliders, BarChart2, FileText, Percent } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Crown } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function MargemBadge({ pct }: { pct: number }) {
  const color = pct >= 30 ? "bg-green-100 text-green-700 border-green-200" : pct >= 15 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>{pct.toFixed(1)}%</span>;
}

function PremiumLock({ title, description, icon: Icon, onClick }: { title: string; description: string; icon: React.ElementType; onClick: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm opacity-70 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
        <Crown size={20} className="text-yellow-500" />
        <span className="text-xs font-semibold text-foreground">Apenas Premium</span>
        <Button size="sm" variant="outline" className="text-xs h-7 mt-1" onClick={() => setLocation("/planos")}>Ver planos</Button>
      </div>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
        <Icon size={18} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// Modal DRE
function DreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: dashboard, isLoading: loadingDash } = useGetDashboardSummary();
  const { data: pe, isLoading: loadingPe } = useGetPontoEquilibrio();

  const isLoading = loadingDash || loadingPe;
  const receita = dashboard?.receita_total ?? 0;
  const custosTotais = dashboard?.custos_totais ?? 0;
  const despesasFixas = pe?.despesas_fixas_total ?? 0;
  const custosVariaveis = Math.max(0, custosTotais - despesasFixas);
  const resultado = dashboard?.resultado_mes ?? 0;
  const margemLiquida = receita > 0 ? (resultado / receita) * 100 : 0;

  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const rows: { label: string; value: string; indent?: boolean; highlight?: boolean; negative?: boolean; separator?: boolean }[] = [
    { label: `(+) Receita Total — ${mesAtual}`, value: fmt(receita) },
    { label: "(-) Custos Variáveis (lançamentos de despesa)", value: fmt(custosVariaveis), indent: true, negative: true },
    { label: "(-) Despesas Fixas / Folha / Pró-labore", value: fmt(despesasFixas), indent: true, negative: true },
    { separator: true, label: "", value: "" },
    { label: "(=) Resultado Operacional do Mês", value: fmt(resultado), highlight: true },
    { label: "Margem Líquida", value: `${margemLiquida.toFixed(1)}%`, highlight: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText size={18} className="text-primary" />DRE — Demonstração do Resultado</DialogTitle>
        </DialogHeader>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <div className="space-y-1">
            {rows.map((row, i) =>
              row.separator ? (
                <div key={i} className="border-t border-border my-1" />
              ) : (
                <div key={i} className={`flex justify-between items-center py-2.5 ${row.highlight ? "border-t border-border font-semibold" : "border-b border-border/40 last:border-0"}`}>
                  <span className={`text-sm ${row.indent ? "pl-4 text-muted-foreground" : row.highlight ? "text-foreground" : "text-foreground"}`}>{row.label}</span>
                  <span className={`text-sm font-medium ${row.negative ? "text-red-500" : row.highlight ? (resultado >= 0 ? "text-green-600" : "text-red-600") : "text-foreground"}`}>{row.value}</span>
                </div>
              )
            )}
            {receita === 0 && (
              <p className="text-xs text-muted-foreground pt-2">Registre receitas em Lançamentos para ver o DRE completo.</p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Dados do mês corrente. Receita e despesas variáveis vêm dos Lançamentos; despesas fixas incluem Despesas Fixas, Folha de Pagamento e Pró-labore dos sócios.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Modal Markup
function MarkupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: topProdutos, isLoading } = useGetTopProdutos();
  const { data: pe } = useGetPontoEquilibrio();

  const margemMedia = pe?.margem_media ?? 0;
  const markupMedioMult = margemMedia > 0 && margemMedia < 100 ? (100 / (100 - margemMedia)) : 0;
  const markupMedioPct = markupMedioMult > 0 ? (markupMedioMult - 1) * 100 : 0;

  function calcMarkup(margemPct: number) {
    if (margemPct <= 0 || margemPct >= 100) return null;
    const mult = 100 / (100 - margemPct);
    return { mult, pct: (mult - 1) * 100 };
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Percent size={18} className="text-primary" />Markup dos Produtos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {margemMedia > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Markup Médio (multiplicador)</p>
                <p className="text-2xl font-bold text-primary">{markupMedioMult.toFixed(2)}x</p>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Markup Médio (%)</p>
                <p className="text-2xl font-bold text-foreground">{markupMedioPct.toFixed(1)}%</p>
              </div>
            </div>
          )}
          {isLoading ? <Skeleton className="h-40 w-full" /> : topProdutos?.length ? (
            <div>
              <p className="text-sm font-semibold mb-2">Markup por produto</p>
              <div className="space-y-0">
                {topProdutos.map(p => {
                  const mk = calcMarkup(p.margem_pct);
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 text-sm">
                      <span className="text-foreground font-medium truncate max-w-[55%]">{p.nome}</span>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-muted-foreground text-xs">{fmt(p.preco_venda)}</span>
                        <span className="font-semibold text-primary w-16">{mk ? `${mk.mult.toFixed(2)}x` : "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Cadastre produtos para ver o markup.</p>
          )}
          <div className="bg-muted/20 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-sm">Como interpretar o markup</p>
            <p>Markup multiplicador = Preço de Venda ÷ Custo Total. Ex: 1,50x significa que o preço é 50% maior que o custo total.</p>
            <p>Fórmula usada: <span className="font-mono">100 ÷ (100 − Margem%)</span>. Baseado na margem de contribuição de cada produto.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal 1: Simulação de Cenário
function SimulacaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: produtos } = useListProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [novoPreco, setNovoPreco] = useState("");

  const produto = produtos?.find(p => p.id === produtoId);
  const preco = parseFloat(novoPreco) || 0;

  function simular() {
    if (!produto || preco <= 0) return null;
    const cmv = produto.cmv ?? 0;
    const maoObra = produto.custo_mao_obra;
    const frete = produto.frete;
    const descontos = preco * (
      (produto.imposto_pct + produto.taxa_cartao_pct + produto.taxa_app_pct + produto.comissao_pct + (produto.taxa_vr_pct ?? 0)) / 100
    );
    const margem = preco - cmv - maoObra - frete - descontos;
    const margemPct = preco > 0 ? (margem / preco) * 100 : 0;
    return { margem, margemPct, descontos };
  }

  const sim = simular();
  const margemAtual = produto ? produto.margem_pct ?? 0 : 0;
  const delta = sim ? sim.margemPct - margemAtual : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sliders size={18} className="text-primary" />Simulação de Cenário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={produtoId} onValueChange={v => { setProdutoId(v); setNovoPreco(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
              <SelectContent>{produtos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {produto && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Preço atual</span><span className="font-medium">{fmt(produto.preco_venda)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Margem atual</span><span className="font-medium">{margemAtual.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CMV</span><span>{fmt(produto.cmv ?? 0)}</span></div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Novo preço de venda (R$)</Label>
            <Input type="number" step="0.01" placeholder="Ex: 25,00" value={novoPreco} onChange={e => setNovoPreco(e.target.value)} />
          </div>

          {sim && produto && preco > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground mb-1">Resultado simulado</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem de contribuição</span>
                <span className={`font-bold ${sim.margem >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(sim.margem)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margem %</span>
                <span className={`font-bold ${sim.margemPct > 30 ? "text-green-600" : sim.margemPct >= 15 ? "text-yellow-600" : "text-red-600"}`}>{sim.margemPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2">
                <span className="text-muted-foreground">Variação vs. preço atual</span>
                <span className={`font-bold ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)} p.p.
                </span>
              </div>
            </div>
          )}

          {sim && produto && preco > 0 && (
            <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">Como interpretar os resultados</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Melhor cenário sugerido</p>
              <p className="text-muted-foreground leading-relaxed">
                {sim.margemPct >= 30
                  ? `Com o preço de ${fmt(preco)}, a margem de ${sim.margemPct.toFixed(1)}% está saudável (acima de 30%). Este é um bom cenário para o seu negócio.`
                  : sim.margemPct >= 15
                  ? `Com o preço de ${fmt(preco)}, a margem de ${sim.margemPct.toFixed(1)}% está em atenção (entre 15% e 30%). Considere reduzir custos ou aumentar o preço para melhorar a lucratividade.`
                  : `Com o preço de ${fmt(preco)}, a margem de ${sim.margemPct.toFixed(1)}% está crítica (abaixo de 15%). Recomenda-se aumentar o preço ou revisar os custos de produção.`}
              </p>
              {delta !== 0 && (
                <p className="text-muted-foreground leading-relaxed">
                  {delta > 0
                    ? `O novo preço aumenta a margem em ${delta.toFixed(1)} p.p. em relação ao preço atual — uma melhora significativa.`
                    : `O novo preço reduz a margem em ${Math.abs(delta).toFixed(1)} p.p. em relação ao preço atual.`}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal 2: Ponto de Equilíbrio Detalhado
function BreakevenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: pe, isLoading } = useGetPontoEquilibrio();
  const { data: produtos } = useListProdutos();

  const produtosComMargem = (produtos ?? []).filter(p => (p.preco_venda ?? 0) > 0);
  const totalProdutos = produtosComMargem.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target size={18} className="text-primary" />Ponto de Equilíbrio Detalhado</DialogTitle>
        </DialogHeader>
        {isLoading ? <Skeleton className="h-40 w-full" /> : pe ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Despesas Fixas Totais", value: fmt(pe.despesas_fixas_total), highlight: false },
                { label: "Margem Média dos Produtos", value: `${pe.margem_media.toFixed(1)}%`, highlight: false },
                { label: "PE Contábil", value: fmt(pe.ponto_contabil), highlight: true },
                { label: "PE Econômico (+20% lucro)", value: fmt(pe.ponto_economico), highlight: true },
              ].map((row, i) => (
                <div key={i} className={`rounded-xl p-4 ${row.highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/40 border border-border"}`}>
                  <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                  <p className={`text-lg font-bold ${row.highlight ? "text-primary" : "text-foreground"}`}>{row.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold mb-2">Unidades mínimas necessárias</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de unidades (PE Contábil)</span>
                <span className="font-medium">{pe.unidades_necessarias.toFixed(0)} unid.</span>
              </div>
              {totalProdutos > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Média por produto ({totalProdutos} cadastrados)</span>
                  <span className="font-medium">{(pe.unidades_necessarias / totalProdutos).toFixed(0)} unid./produto</span>
                </div>
              )}
            </div>

            <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">Como interpretar os resultados</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Melhor resultado sugerido</p>
              <p className="text-muted-foreground leading-relaxed">
                Para cobrir todas as despesas fixas, você precisa faturar pelo menos <strong className="text-foreground">{fmt(pe.ponto_contabil)}</strong> por mês (PE Contábil). Para obter 20% de lucro líquido, o faturamento mínimo é <strong className="text-foreground">{fmt(pe.ponto_economico)}</strong> (PE Econômico).
              </p>
              {pe.ponto_economico > 0 && (
                <p className="text-muted-foreground leading-relaxed">
                  Foque em atingir o PE Econômico — ele garante tanto a cobertura dos custos fixos quanto uma margem de lucro real de 20%, tornando o negócio sustentável no longo prazo.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">Cadastre produtos e despesas fixas para ver a análise.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Modal 3: Análise individual de produto
function AnaliseProdutoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: produtos } = useListProdutos();
  const [produtoId, setProdutoId] = useState("");

  const produto = produtos?.find(p => p.id === produtoId);

  const custoTotal = produto
    ? (produto.cmv ?? 0) + produto.custo_mao_obra + produto.frete
    + produto.preco_venda * (produto.imposto_pct + produto.taxa_cartao_pct + produto.taxa_app_pct + produto.comissao_pct + (produto.taxa_vr_pct ?? 0)) / 100
    : 0;

  const items = produto ? [
    { label: "CMV (ingredientes)", value: produto.cmv ?? 0, pct: produto.preco_venda > 0 ? ((produto.cmv ?? 0) / produto.preco_venda) * 100 : 0 },
    { label: "Mão de obra", value: produto.custo_mao_obra, pct: produto.preco_venda > 0 ? (produto.custo_mao_obra / produto.preco_venda) * 100 : 0 },
    { label: "Frete", value: produto.frete, pct: produto.preco_venda > 0 ? (produto.frete / produto.preco_venda) * 100 : 0 },
    { label: "Imposto", value: produto.preco_venda * produto.imposto_pct / 100, pct: produto.imposto_pct },
    { label: "Taxa Cartão", value: produto.preco_venda * produto.taxa_cartao_pct / 100, pct: produto.taxa_cartao_pct },
    { label: "Taxa App", value: produto.preco_venda * produto.taxa_app_pct / 100, pct: produto.taxa_app_pct },
    { label: "Comissão", value: produto.preco_venda * produto.comissao_pct / 100, pct: produto.comissao_pct },
    { label: "Taxa Vale Refeição", value: produto.preco_venda * (produto.taxa_vr_pct ?? 0) / 100, pct: produto.taxa_vr_pct ?? 0 },
  ].filter(i => i.value > 0) : [];

  const mainCost = items.length > 0 ? [...items].sort((a, b) => b.value - a.value)[0] : null;
  const margemPct = produto?.margem_pct ?? 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart2 size={18} className="text-primary" />Análise Individual do Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={produtoId} onValueChange={setProdutoId}>
              <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
              <SelectContent>{produtos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {produto && (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground">Preço de venda</p>
                  <p className="text-base font-bold">{fmt(produto.preco_venda)}</p>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground">Custo total</p>
                  <p className="text-base font-bold text-red-600">{fmt(custoTotal)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${margemPct > 30 ? "bg-green-50 border-green-200" : margemPct >= 15 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className={`text-base font-bold ${margemPct > 30 ? "text-green-700" : margemPct >= 15 ? "text-yellow-700" : "text-red-700"}`}>{margemPct.toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Composição do custo</p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{fmt(item.value)} <span className="text-muted-foreground text-xs">({item.pct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-sm border border-border">
                <div className="flex justify-between font-bold text-base">
                  <span>Margem de contribuição</span>
                  <span className={produto.margem_contribuicao != null && produto.margem_contribuicao >= 0 ? "text-green-600" : "text-red-600"}>
                    {fmt(produto.margem_contribuicao ?? 0)}
                  </span>
                </div>
              </div>

              <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Como interpretar os resultados</p>
                <p className="text-muted-foreground leading-relaxed">
                  {margemPct >= 30
                    ? `A margem de ${margemPct.toFixed(1)}% está saudável. Este produto contribui bem para a lucratividade do negócio — continue monitorando os custos para mantê-la.`
                    : margemPct >= 15
                    ? `A margem de ${margemPct.toFixed(1)}% está em atenção. Considere revisar os custos ou ajustar o preço de venda para chegar acima de 30%.`
                    : `A margem de ${margemPct.toFixed(1)}% está crítica. Este produto cobre poucos custos — avalie aumentar o preço ou reduzir insumos urgentemente.`}
                </p>
                {mainCost && (
                  <p className="text-muted-foreground leading-relaxed">
                    O maior custo deste produto é <strong className="text-foreground">{mainCost.label}</strong> ({fmt(mainCost.value)}, {mainCost.pct.toFixed(1)}% do preço de venda).
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Relatorios() {
  const { data: topProdutos, isLoading: loadingTop } = useGetTopProdutos();
  const { data: alertas, isLoading: loadingAlertas } = useGetAlertasMargem();
  const { data: fluxo, isLoading: loadingFluxo } = useGetFluxoSemanal();
  const { data: pe, isLoading: loadingPe } = useGetPontoEquilibrio();
  const { data: assinatura, isLoading: assinaturaLoading } = useAssinatura();

  const isPro = planAtLeast(assinatura?.planoEfetivo ?? "gratis", "pro");
  const isPremium = planAtLeast(assinatura?.planoEfetivo ?? "gratis", "premium");

  const [modalSimulacao, setModalSimulacao] = useState(false);
  const [modalBreakeven, setModalBreakeven] = useState(false);
  const [modalAnalise, setModalAnalise] = useState(false);
  const [modalDre, setModalDre] = useState(false);
  const [modalMarkup, setModalMarkup] = useState(false);
  const [, setLocation] = useLocation();

  if (!assinaturaLoading && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7A4FB2] to-[#4D2F70] flex items-center justify-center mb-5 mx-auto shadow-lg">
          <Crown size={28} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Relatórios</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Acesse ranking de produtos por margem, alertas de margem e muito mais. Disponível a partir do plano <strong>Pro</strong>.
        </p>
        <Button
          className="bg-[#7A4FB2] hover:bg-[#6C3FA0] text-white px-8"
          onClick={() => setLocation("/planos")}
        >
          Fazer upgrade para Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="relatorios-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise detalhada do seu negócio</p>
      </div>

      {/* Fluxo semanal — Premium */}
      {isPremium ? (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary" />Fluxo de Caixa — Últimos 7 Dias</h2>
          {loadingFluxo ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fluxo} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="receita" name="Receita" fill="#7A4FB2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resultado" name="Resultado" fill="#F2B544" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <PremiumLock
          title="Fluxo de Caixa — Últimos 7 Dias"
          description="Veja receitas, despesas e resultado dos últimos 7 dias. Disponível no plano Premium."
          icon={TrendingUp}
          onClick={() => {}}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Ponto de equilíbrio — Premium */}
        {isPremium ? (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold mb-4">Ponto de Equilíbrio</h2>
            {loadingPe ? <Skeleton className="h-40 w-full" /> : pe ? (
              <div className="space-y-0">
                {[
                  { label: "Despesas Fixas Totais", value: fmt(pe.despesas_fixas_total), highlight: false },
                  { label: "Margem de Contribuição Média", value: `${pe.margem_media.toFixed(1)}%`, highlight: false },
                  { label: "PE Contábil (faturamento mín.)", value: fmt(pe.ponto_contabil), highlight: true },
                  { label: "PE Econômico (com lucro 20%)", value: fmt(pe.ponto_economico), highlight: true },
                  { label: "Unidades mínimas necessárias", value: pe.unidades_necessarias.toFixed(0) + " unid.", highlight: false },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-3 border-b border-border last:border-0 ${row.highlight ? "font-semibold" : ""}`}>
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className={row.highlight ? "text-primary font-bold" : ""}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">Cadastre produtos e despesas fixas para ver a análise</div>
            )}
          </div>
        ) : (
          <PremiumLock
            title="Ponto de Equilíbrio"
            description="Calcule o faturamento mínimo para cobrir seus custos fixos. Disponível no plano Premium."
            icon={Target}
            onClick={() => {}}
          />
        )}

        {/* Alertas margem */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500" />Alertas de Margem</h2>
          {loadingAlertas ? <Skeleton className="h-40 w-full" /> : alertas?.length ? (
            <div className="space-y-0">
              {alertas.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0" data-testid={`alerta-rel-${a.id}`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${a.nivel === "critico" ? "bg-red-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{a.nivel === "critico" ? "Crítico — abaixo de 15%" : "Atenção — entre 15% e 30%"}</p>
                  </div>
                  <MargemBadge pct={a.margem_pct} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhum alerta. Suas margens estão saudáveis!</div>
          )}
        </div>
      </div>

      {/* Top produtos */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Ranking de Produtos por Margem</h2>
        {loadingTop ? <Skeleton className="h-40 w-full" /> : topProdutos?.length ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-left py-2 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right py-2 font-medium text-muted-foreground hidden sm:table-cell">Preço</th>
                <th className="text-right py-2 font-medium text-muted-foreground hidden sm:table-cell">Margem (R$)</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Margem %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProdutos.map((p, i) => (
                <tr key={p.id} className="hover:bg-muted/30" data-testid={`ranking-produto-${p.id}`}>
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-muted text-muted-foreground" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted/50 text-muted-foreground"}`}>{i + 1}</span>
                  </td>
                  <td className="py-3 font-medium">{p.nome}</td>
                  <td className="py-3 text-muted-foreground hidden sm:table-cell">{p.categoria ?? "-"}</td>
                  <td className="py-3 text-right hidden sm:table-cell">{fmt(p.preco_venda)}</td>
                  <td className="py-3 text-right font-medium hidden sm:table-cell">{fmt(p.margem_contribuicao)}</td>
                  <td className="py-3 text-center"><MargemBadge pct={p.margem_pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</div>
        )}
      </div>

      {/* Premium Reports */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold">Relatórios Avançados</h2>
          {isPremium ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Premium</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Apenas Premium</Badge>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isPremium ? (
            <>
              <button onClick={() => setModalSimulacao(true)} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <Sliders size={18} />
                </div>
                <p className="font-semibold text-foreground">Simulação de Cenário</p>
                <p className="text-sm text-muted-foreground mt-1">Veja o impacto de novos preços na sua margem</p>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">CMV = Custo da Mercadoria Vendida · MO = Mão de obra · MC = Margem de Contribuição</p>
              </button>
              <button onClick={() => setModalBreakeven(true)} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <Target size={18} />
                </div>
                <p className="font-semibold text-foreground">Ponto de Equilíbrio Detalhado</p>
                <p className="text-sm text-muted-foreground mt-1">Análise completa do ponto de equilíbrio</p>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">PE Contábil = faturamento mín. p/ cobrir custos fixos · PE Econômico = PE + 20% de lucro</p>
              </button>
              <button onClick={() => setModalAnalise(true)} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <BarChart2 size={18} />
                </div>
                <p className="font-semibold text-foreground">Análise Individual</p>
                <p className="text-sm text-muted-foreground mt-1">Detalhe completo de cada produto</p>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">CMV, MO, Imposto, VR = Vale Refeição · % = participação no preço de venda</p>
              </button>
              <button onClick={() => setModalDre(true)} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <FileText size={18} />
                </div>
                <p className="font-semibold text-foreground">DRE</p>
                <p className="text-sm text-muted-foreground mt-1">Demonstração do Resultado do mês corrente</p>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">Receita − Custos Variáveis − Despesas Fixas = Resultado Operacional</p>
              </button>
              <button onClick={() => setModalMarkup(true)} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                  <Percent size={18} />
                </div>
                <p className="font-semibold text-foreground">Markup</p>
                <p className="text-sm text-muted-foreground mt-1">Markup médio e por produto com base na margem</p>
                <p className="text-xs text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">Markup = 100 ÷ (100 − Margem%) · Multiplicador sobre o custo total</p>
              </button>
            </>
          ) : (
            <>
              <PremiumLock title="Simulação de Cenário" description="Teste novos preços e veja o impacto na margem" icon={Sliders} onClick={() => {}} />
              <PremiumLock title="Ponto de Equilíbrio Detalhado" description="Análise completa do ponto de equilíbrio" icon={Target} onClick={() => {}} />
              <PremiumLock title="Análise Individual" description="Detalhe completo de custos por produto" icon={BarChart2} onClick={() => {}} />
              <PremiumLock title="DRE" description="Demonstração do resultado do mês com receitas e custos" icon={FileText} onClick={() => {}} />
              <PremiumLock title="Markup" description="Markup médio e por produto com base na margem" icon={Percent} onClick={() => {}} />
            </>
          )}
        </div>
      </div>

      <SimulacaoModal open={modalSimulacao} onClose={() => setModalSimulacao(false)} />
      <BreakevenModal open={modalBreakeven} onClose={() => setModalBreakeven(false)} />
      <AnaliseProdutoModal open={modalAnalise} onClose={() => setModalAnalise(false)} />
      <DreModal open={modalDre} onClose={() => setModalDre(false)} />
      <MarkupModal open={modalMarkup} onClose={() => setModalMarkup(false)} />
    </div>
  );
}
