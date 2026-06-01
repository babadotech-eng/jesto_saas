import { useState } from "react";
import { useGetTopProdutos, useGetAlertasMargem, useGetFluxoSemanal, useGetPontoEquilibrio, useListProdutos } from "@workspace/api-client-react";
import { useAssinatura } from "@/hooks/useAssinatura";
import { TrendingUp, AlertTriangle, Target, Sliders, BarChart2 } from "lucide-react";
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
  const { data: assinatura } = useAssinatura();

  const isPremium = assinatura?.plano === "premium";

  const [modalSimulacao, setModalSimulacao] = useState(false);
  const [modalBreakeven, setModalBreakeven] = useState(false);
  const [modalAnalise, setModalAnalise] = useState(false);

  return (
    <div className="space-y-6" data-testid="relatorios-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Análise detalhada do seu negócio</p>
      </div>

      {/* Fluxo semanal */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary" />Fluxo de Caixa — Últimos 7 Dias</h2>
        {loadingFluxo ? <Skeleton className="h-48 w-full" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fluxo} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="receita" name="Receita" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resultado" name="Resultado" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Ponto de equilíbrio */}
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
            </>
          ) : (
            <>
              <PremiumLock title="Simulação de Cenário" description="Teste novos preços e veja o impacto na margem" icon={Sliders} onClick={() => {}} />
              <PremiumLock title="Ponto de Equilíbrio Detalhado" description="Análise completa do ponto de equilíbrio" icon={Target} onClick={() => {}} />
              <PremiumLock title="Análise Individual" description="Detalhe completo de custos por produto" icon={BarChart2} onClick={() => {}} />
            </>
          )}
        </div>
      </div>

      <SimulacaoModal open={modalSimulacao} onClose={() => setModalSimulacao(false)} />
      <BreakevenModal open={modalBreakeven} onClose={() => setModalBreakeven(false)} />
      <AnaliseProdutoModal open={modalAnalise} onClose={() => setModalAnalise(false)} />
    </div>
  );
}
