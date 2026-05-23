import { useGetDashboardSummary, useGetTopProdutos, useGetAlertasMargem, useGetFluxoSemanal, useGetPontoEquilibrio } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Package, Carrot, FileText, AlertTriangle, Plus, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function MargemBadge({ pct }: { pct: number }) {
  if (pct > 30) return <Badge className="bg-green-100 text-green-700 border-green-200">{pct.toFixed(1)}%</Badge>;
  if (pct >= 15) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{pct.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">{pct.toFixed(1)}%</Badge>;
}

function KpiCard({ title, value, sub, icon: Icon, trend }: { title: string; value: string; sub?: string; icon: any; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow" data-testid="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
          {trend === "up" ? <TrendingUp size={12} /> : trend === "down" ? <TrendingDown size={12} /> : null}
          {trend === "up" ? "Positivo este mês" : trend === "down" ? "Negativo este mês" : ""}
        </div>
      )}
    </div>
  );
}

const DONUT_COLORS = ["#F59E0B", "#1e293b", "#94a3b8"];

const CHART_COLORS = { receita: "#F59E0B", despesa: "#ef4444" };

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: topProdutos, isLoading: loadingTop } = useGetTopProdutos();
  const { data: alertas, isLoading: loadingAlertas } = useGetAlertasMargem();
  const { data: fluxo, isLoading: loadingFluxo } = useGetFluxoSemanal();
  const { data: pe, isLoading: loadingPe } = useGetPontoEquilibrio();

  const donutData = summary
    ? [
        { name: "Receita", value: summary.receita_total },
        { name: "Custos", value: summary.custos_totais },
      ]
    : [];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : summary ? (
          <>
            <KpiCard title="Receita Total" value={fmt(summary.receita_total)} sub="este mês" icon={DollarSign} trend="up" />
            <KpiCard title="Custos Totais" value={fmt(summary.custos_totais)} sub="este mês" icon={TrendingDown} />
            <KpiCard title="Margem Média" value={`${summary.margem_media.toFixed(1)}%`} sub="dos produtos" icon={BarChart3} trend={summary.margem_media > 30 ? "up" : summary.margem_media >= 15 ? "neutral" : "down"} />
            <KpiCard title="Resultado do Mês" value={fmt(summary.resultado_mes)} icon={TrendingUp} trend={summary.resultado_mes > 0 ? "up" : "down"} />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Fluxo dos Últimos 7 Dias</h2>
          {loadingFluxo ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fluxo} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l) => `Dia: ${l}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="receita" name="Receita" fill={CHART_COLORS.receita} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill={CHART_COLORS.despesa} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut resultado */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Resultado do Mês</h2>
          {loadingSummary ? <Skeleton className="h-48 w-full" /> : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              {summary && (
                <div className="text-center mt-2">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={`text-xl font-bold ${summary.resultado_mes >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(summary.resultado_mes)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Ponto de equilíbrio */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Ponto de Equilíbrio</h2>
          {loadingPe ? <Skeleton className="h-32 w-full" /> : pe ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Despesas fixas</span>
                <span className="font-semibold text-sm">{fmt(pe.despesas_fixas_total)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Margem média</span>
                <span className="font-semibold text-sm">{pe.margem_media.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">PE Contábil</span>
                <span className="font-bold text-primary">{fmt(pe.ponto_contabil)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">PE Econômico</span>
                <span className="font-bold text-primary">{fmt(pe.ponto_economico)}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Cadastre produtos e despesas para ver a análise
            </div>
          )}
        </div>

        {/* Contadores */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Cadastros</h2>
          {loadingSummary ? <Skeleton className="h-32 w-full" /> : summary ? (
            <div className="space-y-3">
              <Link href="/produtos" className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-primary" />
                  <span className="text-sm font-medium">Produtos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{summary.total_produtos}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Link>
              <Link href="/insumos" className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Carrot size={18} className="text-primary" />
                  <span className="text-sm font-medium">Insumos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{summary.total_insumos}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Link>
              <Link href="/ficha-tecnica" className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary" />
                  <span className="text-sm font-medium">Fichas Técnicas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{summary.total_fichas}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Ações rápidas */}
        <div className="bg-sidebar text-sidebar-foreground rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Ações Rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Cadastrar Produto", href: "/produtos" },
              { label: "Criar Ficha Técnica", href: "/ficha-tecnica" },
              { label: "Registrar Despesa", href: "/despesas" },
              { label: "Ver Relatórios", href: "/relatorios" },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                data-testid={`quick-action-${a.href.replace("/", "")}`}
              >
                <Plus size={16} className="text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top produtos */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Top Produtos por Margem</h2>
            <Link href="/produtos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {loadingTop ? <Skeleton className="h-32 w-full" /> : topProdutos?.length ? (
            <div className="space-y-2">
              {topProdutos.slice(0, 4).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0" data-testid={`top-produto-${p.id}`}>
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{fmt(p.preco_venda)}</p>
                  </div>
                  <MargemBadge pct={p.margem_pct} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum produto cadastrado ainda.{" "}
              <Link href="/produtos" className="text-primary hover:underline">Cadastrar agora</Link>
            </div>
          )}
        </div>

        {/* Alertas margem */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Alertas de Margem Baixa</h2>
            <AlertTriangle size={18} className="text-yellow-500" />
          </div>
          {loadingAlertas ? <Skeleton className="h-32 w-full" /> : alertas?.length ? (
            <div className="space-y-2">
              {alertas.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0" data-testid={`alerta-${a.id}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.nivel === "critico" ? "bg-red-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.nivel === "critico" ? "Crítico" : "Atenção"}</p>
                  </div>
                  <MargemBadge pct={a.margem_pct} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum alerta. Suas margens estão saudáveis!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
