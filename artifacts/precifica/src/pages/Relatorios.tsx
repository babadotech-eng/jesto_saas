import { useGetTopProdutos, useGetAlertasMargem, useGetFluxoSemanal, useGetPontoEquilibrio } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function MargemBadge({ pct }: { pct: number }) {
  if (pct > 30) return <Badge className="bg-green-100 text-green-700 border-green-200">{pct.toFixed(1)}%</Badge>;
  if (pct >= 15) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{pct.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">{pct.toFixed(1)}%</Badge>;
}

export default function Relatorios() {
  const { data: topProdutos, isLoading: loadingTop } = useGetTopProdutos();
  const { data: alertas, isLoading: loadingAlertas } = useGetAlertasMargem();
  const { data: fluxo, isLoading: loadingFluxo } = useGetFluxoSemanal();
  const { data: pe, isLoading: loadingPe } = useGetPontoEquilibrio();

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
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhum alerta. Suas margens estao saudáveis!</div>
          )}
        </div>
      </div>

      {/* Top produtos */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Ranking de Produtos por Margem</h2>
        {loadingTop ? <Skeleton className="h-40 w-full" /> : topProdutos?.length ? (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-left py-2 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Preço</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Margem (R$)</th>
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
                  <td className="py-3 text-right">{fmt(p.preco_venda)}</td>
                  <td className="py-3 text-right font-medium">{fmt(p.margem_contribuicao)}</td>
                  <td className="py-3 text-center"><MargemBadge pct={p.margem_pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</div>
        )}
      </div>
    </div>
  );
}
