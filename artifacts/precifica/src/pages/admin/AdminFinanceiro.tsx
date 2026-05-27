import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DollarSign, TrendingUp, Star, Crown, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { adminFetch, type AdminFinanceiro } from "@/lib/adminFetch";
import { exportFinanceiroXlsx } from "@/lib/exportXlsx";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d));
}

function PlanoBadge({ plano }: { plano: string }) {
  if (plano === "premium")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Crown size={10} />Premium</span>;
  if (plano === "pro")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Star size={10} />Pro</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Grátis</span>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-sm text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-amber-600 font-semibold">{brl(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function AdminFinanceiro() {
  const { data, isLoading } = useQuery<AdminFinanceiro>({
    queryKey: ["admin", "financeiro"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/financeiro");
      if (!res.ok) throw new Error("Erro ao buscar dados financeiros");
      return res.json();
    },
    staleTime: 60_000,
  });

  const cards = [
    {
      label: "MRR Atual",
      value: data ? brl(data.mrrAtual) : "—",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: "Receita mensal recorrente ativa",
    },
    {
      label: "Plano Pro",
      value: data ? `${data.receitaPorPlano.pro.count} assinante${data.receitaPorPlano.pro.count !== 1 ? "s" : ""}` : "—",
      icon: Star,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: data ? brl(data.receitaPorPlano.pro.receita) + "/mês" : "—",
    },
    {
      label: "Plano Premium",
      value: data ? `${data.receitaPorPlano.premium.count} assinante${data.receitaPorPlano.premium.count !== 1 ? "s" : ""}` : "—",
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
      sub: data ? brl(data.receitaPorPlano.premium.receita) + "/mês" : "—",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">Receita e histórico de assinaturas</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={!data?.historico.length}
          onClick={() => data && exportFinanceiroXlsx(data)}
        >
          <FileSpreadsheet size={14} />
          Exportar Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading
                  ? <Skeleton className="h-6 w-24 mt-1" />
                  : <p className="text-xl font-bold text-foreground">{value}</p>}
                {!isLoading && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-amber-500" />
          <h3 className="font-semibold text-foreground">Receita por Mês (últimos 12 meses)</h3>
        </div>
        {isLoading ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : !data?.mrrMensal.some(m => m.receita > 0) ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            Nenhuma receita registrada nos últimos 12 meses.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.mrrMensal ?? []} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `R$${v}`}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="receita" name="Receita" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">Histórico de Assinaturas Pagas</h3>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : !data?.historico.length ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Nenhuma assinatura paga registrada ainda.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.historico.map((row, i) => (
                  <tr key={`${row.userId}-${i}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[180px]">{row.nomeCompleto ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.email}</p>
                    </td>
                    <td className="px-4 py-3"><PlanoBadge plano={row.plano} /></td>
                    <td className="px-4 py-3 font-medium text-green-700 hidden sm:table-cell">{brl(row.valor)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmtDate(row.createdAt)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium ${row.status === "ativo" ? "text-green-600" : "text-red-500"}`}>
                        {row.status === "ativo" ? "Ativo" : "Cancelado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
