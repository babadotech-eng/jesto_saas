import { useState } from "react";
import {
  useGetDashboardSummary,
  useGetTopProdutos,
  useGetAlertasMargem,
  useGetFluxoSemanal,
  useGetPontoEquilibrio,
  useListDespesas,
  useListLancamentos,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import {
  Package, FileText, Carrot, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2, Circle,
  Play, Pause, Clock,
} from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return `R$${(n / 1000).toFixed(1)}k`;
  return fmt(n);
}

// ── Circular gauge (like Time Tracker) ──────────────────────────────────────
function CircularGauge({ pct, centerTop, centerBot }: { pct: number; centerTop: string; centerBot: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const safeP = Math.min(100, Math.max(0, pct));
  const offset = circ * (1 - safeP / 100);
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} strokeWidth="9" fill="none" stroke="#EDEBE0" />
        <circle cx="54" cy="54" r={r} strokeWidth="9" fill="none"
          stroke="#F59E0B" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-extrabold text-zinc-900 leading-none">{centerTop}</span>
        <span className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{centerBot}</span>
      </div>
    </div>
  );
}

// ── Metric pill (top progress bars) ─────────────────────────────────────────
function MetricPill({ label, pct, variant }: { label: string; pct: number; variant: "amber" | "dark" | "stripe" | "light" }) {
  const safe = Math.min(100, Math.max(0, pct));
  const fills: Record<typeof variant, string> = {
    amber: "bg-amber-400",
    dark: "bg-zinc-800",
    stripe: "bg-[repeating-linear-gradient(45deg,#F59E0B,#F59E0B_4px,#FDE68A_4px,#FDE68A_8px)]",
    light: "bg-zinc-300",
  };
  return (
    <div className="flex-1 bg-white/80 rounded-full px-4 py-2.5 shadow-sm flex items-center gap-2.5 min-w-0 border border-white">
      <span className="text-[11px] font-semibold text-zinc-500 shrink-0 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${variant !== "stripe" ? fills[variant] : ""}`}
          style={variant === "stripe"
            ? { width: `${safe}%`, background: "repeating-linear-gradient(45deg,#F59E0B,#F59E0B 4px,#FDE68A 4px,#FDE68A 8px)" }
            : { width: `${safe}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-zinc-700 shrink-0">{safe.toFixed(0)}%</span>
    </div>
  );
}

// ── Accordion item ───────────────────────────────────────────────────────────
function AccordionItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left hover:bg-zinc-50 px-1 rounded-lg transition-colors">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        <div className="flex items-center gap-2">
          {value && <span className="text-xs text-zinc-400">{value}</span>}
          {children ? (open ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />) : null}
        </div>
      </button>
      {open && children && <div className="pb-2 px-1">{children}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary } = useGetDashboardSummary();
  const { data: topProdutos } = useGetTopProdutos();
  const { data: alertas } = useGetAlertasMargem();
  const { data: fluxo } = useGetFluxoSemanal();
  const { data: pe } = useGetPontoEquilibrio();
  const { data: despesas } = useListDespesas();
  const { data: lancamentos } = useListLancamentos();

  const userName = user?.email?.split("@")[0] ?? "usuário";

  // ── derived data ──
  const receitaTotal = summary?.receita_total ?? 0;
  const custosTotal = summary?.custos_totais ?? 0;
  const margem = summary?.margem_media ?? 0;
  const resultado = summary?.resultado_mes ?? 0;
  const maxVal = Math.max(receitaTotal, custosTotal, 1);

  // Weekly chart data mapped to day abbrev
  const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const chartData = (fluxo ?? []).map(d => ({
    day: DIAS[new Date(d.data + "T12:00:00").getDay()],
    receita: d.receita,
    despesa: d.despesa,
    isToday: d.data === new Date().toISOString().slice(0, 10),
  }));

  // Break-even gauge
  const pePct = pe && pe.ponto_contabil > 0 ? Math.min(100, (receitaTotal / pe.ponto_contabil) * 100) : 0;

  // Margin health split
  const totalP = topProdutos?.length ?? 0;
  const saudaveis = topProdutos?.filter(p => p.margem_pct >= 30).length ?? 0;
  const atencao = topProdutos?.filter(p => p.margem_pct >= 15 && p.margem_pct < 30).length ?? 0;
  const criticos = topProdutos?.filter(p => p.margem_pct < 15).length ?? 0;
  const saudavelPct = totalP > 0 ? (saudaveis / totalP) * 100 : 0;
  const margemSaude = margem > 0 ? margem : 0;

  // Lançamentos recentes
  const lancRecentes = (lancamentos ?? []).slice(0, 5);

  // Despesas agrupadas por categoria
  const despCats = despesas?.reduce<Record<string, number>>((acc, d) => {
    const cat = d.categoria ?? "Outras";
    acc[cat] = (acc[cat] ?? 0) + d.valor;
    return acc;
  }, {});

  return (
    // Warm cream background — expand to fill Layout's padded container
    <div className="-m-8 min-h-full bg-[#EDEBE0] p-7" data-testid="dashboard-page">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-zinc-500 text-sm font-medium mb-0.5">Bem-vindo</p>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight leading-none">
            {userName.charAt(0).toUpperCase() + userName.slice(1)}
          </h1>
        </div>
        <div className="flex items-center gap-8">
          {[
            { icon: Package, value: summary?.total_produtos ?? 0, label: "Produtos" },
            { icon: FileText, value: summary?.total_fichas ?? 0, label: "Fichas" },
            { icon: Carrot, value: summary?.total_insumos ?? 0, label: "Insumos" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-0.5">
                <Icon size={13} />
                <span className="text-[11px] font-medium">{label}</span>
              </div>
              <span className="text-4xl font-black text-zinc-900 leading-none tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── METRIC PILLS ────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-5">
        <MetricPill label="Receita" pct={maxVal > 0 ? (receitaTotal / maxVal) * 100 : 0} variant="amber" />
        <MetricPill label="Custos" pct={maxVal > 0 ? (custosTotal / maxVal) * 100 : 0} variant="dark" />
        <MetricPill label="Margem Média" pct={margem} variant="stripe" />
        <MetricPill label="Resultado" pct={receitaTotal > 0 ? Math.max(0, (resultado / receitaTotal) * 100) : 0} variant="light" />
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[200px_1fr_1fr_200px] gap-3 mb-3">

        {/* Col 1 — Dark summary card */}
        <div className="bg-zinc-900 rounded-2xl p-5 flex flex-col justify-between text-white min-h-[220px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center mb-3">
              <span className="text-zinc-900 font-black text-lg">P</span>
            </div>
            <p className="text-zinc-400 text-xs font-medium">Resultado do mês</p>
            <p className={`text-2xl font-black mt-0.5 leading-none ${resultado >= 0 ? "text-amber-400" : "text-red-400"}`}>
              {fmtShort(resultado)}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-xs">Receita</span>
              <span className="text-xs font-semibold text-green-400">{fmtShort(receitaTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-xs">Custos</span>
              <span className="text-xs font-semibold text-red-400">{fmtShort(custosTotal)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <span className="inline-flex items-center gap-1 bg-amber-400/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {margem.toFixed(1)}% margem média
              </span>
            </div>
          </div>
        </div>

        {/* Col 2 — Fluxo semanal (Progress) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Fluxo Semanal</p>
              <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">{fmtShort(receitaTotal)}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Receita este mês</p>
            </div>
            <Link href="/relatorios">
              <button className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors">
                <ArrowUpRight size={14} className="text-zinc-500" />
              </button>
            </Link>
          </div>
          <div className="mt-4 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={18} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? "#F59E0B" : "#E5E7EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 3 — Ponto de Equilíbrio (Time tracker) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">P. Equilíbrio</p>
            </div>
            <Link href="/relatorios">
              <button className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors">
                <ArrowUpRight size={14} className="text-zinc-500" />
              </button>
            </Link>
          </div>

          <CircularGauge
            pct={pePct}
            centerTop={`${pePct.toFixed(0)}%`}
            centerBot="faturado"
          />

          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="text-[10px] text-zinc-400">Faturado</p>
              <p className="text-xs font-bold text-zinc-700">{fmtShort(receitaTotal)}</p>
            </div>
            <div className="w-px h-6 bg-zinc-100" />
            <div className="text-center">
              <p className="text-[10px] text-zinc-400">Meta (PE)</p>
              <p className="text-xs font-bold text-zinc-700">{fmtShort(pe?.ponto_contabil ?? 0)}</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <button className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
              <TrendingUp size={14} className="text-zinc-900" />
            </button>
            <button className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
              <TrendingDown size={14} className="text-zinc-500" />
            </button>
            <button className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
              <Clock size={14} className="text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Col 4 — Saúde das margens (Onboarding %) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Saúde</p>
            <span className="text-3xl font-black text-zinc-900 leading-none">{margemSaude.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">margem média</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-zinc-500">Saudáveis</span>
                <span className="text-xs font-bold text-green-600">{saudaveis}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all duration-700" style={{ width: `${saudavelPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-zinc-500">Atenção</span>
                <span className="text-xs font-bold text-amber-600">{atencao}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: totalP > 0 ? `${(atencao / totalP) * 100}%` : "0%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-zinc-500">Críticos</span>
                <span className="text-xs font-bold text-red-600">{criticos}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all duration-700" style={{ width: totalP > 0 ? `${(criticos / totalP) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[200px_1fr_200px] gap-3">

        {/* Col 1 — Despesas accordion */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-3">Despesas Fixas</p>
          {!despCats || Object.keys(despCats).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-400">Nenhuma despesa cadastrada</p>
              <Link href="/despesas" className="text-xs text-amber-500 font-medium hover:underline mt-1 block">Adicionar</Link>
            </div>
          ) : (
            <div>
              {Object.entries(despCats).map(([cat, val]) => (
                <AccordionItem key={cat} label={cat} value={fmtShort(val)}>
                  <p className="text-xs text-zinc-500">Total: {fmt(val)}</p>
                </AccordionItem>
              ))}
              <div className="pt-3 mt-1 border-t border-zinc-100">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-zinc-600">Total</span>
                  <span className="text-xs font-bold text-zinc-900">{fmt(despesas?.reduce((s, d) => s + d.valor, 0) ?? 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Col 2 — Lançamentos recentes (wide, like the calendar) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Lançamentos Recentes</p>
            <Link href="/lancamentos" className="text-xs text-amber-500 font-semibold hover:underline">Ver todos</Link>
          </div>

          {lancRecentes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-400">Nenhum lançamento registrado</p>
              <Link href="/lancamentos" className="text-xs text-amber-500 font-medium hover:underline mt-1 block">Registrar agora</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lancRecentes.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${l.tipo === "receita" ? "bg-green-100" : "bg-red-100"}`}>
                    {l.tipo === "receita"
                      ? <TrendingUp size={15} className="text-green-600" />
                      : <TrendingDown size={15} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">{l.descricao}</p>
                    <p className="text-xs text-zinc-400">{new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${l.tipo === "receita" ? "text-green-600" : "text-red-500"}`}>
                    {l.tipo === "receita" ? "+" : "-"}{fmtShort(l.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 4 — Top produtos task list (Onboarding Task) */}
        <div className="bg-zinc-900 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Top Produtos</p>
            <span className="text-sm font-bold text-zinc-300">{saudaveis}/{totalP}</span>
          </div>

          {!topProdutos?.length ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-500">Nenhum produto</p>
              <Link href="/produtos" className="text-xs text-amber-400 font-medium hover:underline mt-1 block">Cadastrar</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProdutos.slice(0, 6).map(p => {
                const healthy = p.margem_pct >= 30;
                const warn = p.margem_pct >= 15 && p.margem_pct < 30;
                return (
                  <div key={p.id} className="flex items-center gap-2.5">
                    {healthy
                      ? <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                      : warn
                        ? <CheckCircle2 size={15} className="text-zinc-500 shrink-0" />
                        : <Circle size={15} className="text-zinc-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{p.nome}</p>
                      <p className="text-[10px] text-zinc-500">{p.margem_pct.toFixed(1)}% margem</p>
                    </div>
                  </div>
                );
              })}
              <Link href="/relatorios" className="block mt-3 text-xs text-amber-400 font-semibold hover:underline">
                Ver ranking completo →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
