import { useState } from "react";
import {
  useGetDashboardSummary,
  useGetTopProdutos,
  useGetFluxoSemanal,
  useGetPontoEquilibrio,
  useListDespesas,
  useListLancamentos,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell,
} from "recharts";
import { usePerfil } from "@/hooks/usePerfil";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import {
  Package, FileText, Carrot, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2, Circle,
  Clock,
} from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return `R$${(n / 1000).toFixed(1)}k`;
  return fmt(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function CircularGauge({ pct, centerTop, centerBot }: { pct: number; centerTop: string; centerBot: string }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const safeP = Math.min(100, Math.max(0, pct));
  const offset = circ * (1 - safeP / 100);
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} strokeWidth="9" fill="none" stroke="#E5E7EB" />
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

function MetricPill({ label, pct, variant }: { label: string; pct: number; variant: "amber" | "dark" | "stripe" | "light" }) {
  const safe = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex-1 bg-white rounded-full px-4 py-2.5 shadow-sm flex items-center gap-2.5 min-w-0 border border-[#E5E7EB]">
      <span className="text-[11px] font-semibold text-zinc-500 shrink-0 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${safe}%`,
            background: variant === "amber" ? "#F59E0B"
              : variant === "dark" ? "#1F2937"
              : variant === "stripe" ? "repeating-linear-gradient(45deg,#F59E0B,#F59E0B 4px,#FDE68A 4px,#FDE68A 8px)"
              : "#9CA3AF",
          }}
        />
      </div>
      <span className="text-[11px] font-bold text-zinc-700 shrink-0">{safe.toFixed(0)}%</span>
    </div>
  );
}

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

export default function Painel() {
  const { user } = useAuth();
  const { data: perfil } = usePerfil();
  const { data: summary } = useGetDashboardSummary();
  const { data: topProdutos } = useGetTopProdutos();
  const { data: fluxo } = useGetFluxoSemanal();
  const { data: pe } = useGetPontoEquilibrio();
  const { data: despesas } = useListDespesas();
  const { data: lancamentos } = useListLancamentos();

  const greeting = getGreeting();
  const displayName = perfil?.nome_completo?.trim().split(" ")[0] || perfil?.nome_negocio || user?.email?.split("@")[0] || "";
  const greetingText = displayName ? `${greeting}, ${displayName}!` : greeting;

  const receitaTotal = summary?.receita_total ?? 0;
  const custosTotal = summary?.custos_totais ?? 0;
  const margem = summary?.margem_media ?? 0;
  const resultado = summary?.resultado_mes ?? 0;
  const maxVal = Math.max(receitaTotal, custosTotal, 1);

  const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const chartData = (fluxo ?? []).map(d => ({
    day: DIAS[new Date(d.data + "T12:00:00").getDay()],
    receita: d.receita,
    isToday: d.data === new Date().toISOString().slice(0, 10),
  }));

  const pePct = pe && pe.ponto_contabil > 0 ? Math.min(100, (receitaTotal / pe.ponto_contabil) * 100) : 0;

  const totalP = topProdutos?.length ?? 0;
  const saudaveis = topProdutos?.filter(p => p.margem_pct >= 30).length ?? 0;
  const atencao = topProdutos?.filter(p => p.margem_pct >= 15 && p.margem_pct < 30).length ?? 0;
  const criticos = topProdutos?.filter(p => p.margem_pct < 15).length ?? 0;
  const saudavelPct = totalP > 0 ? (saudaveis / totalP) * 100 : 0;

  const lancRecentes = (lancamentos ?? []).slice(0, 5);

  const despCats = despesas?.reduce<Record<string, number>>((acc, d) => {
    const cat = d.categoria ?? "Outras";
    acc[cat] = (acc[cat] ?? 0) + d.valor;
    return acc;
  }, {});

  return (
    <div className="-m-4 sm:-m-6 md:-m-8 min-h-full bg-gray-100 p-4 sm:p-6 md:p-7" data-testid="painel-page">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="min-w-0">
          <p className="text-zinc-500 text-sm font-medium mb-0.5">{greeting}</p>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-none truncate">
            {displayName
              ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
              : user?.email?.split("@")[0]}
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-4 md:gap-8 shrink-0">
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
              <span className="text-3xl md:text-4xl font-black text-zinc-900 leading-none tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── METRIC PILLS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:flex gap-2.5 mb-5">
        <MetricPill label="Receita" pct={maxVal > 0 ? (receitaTotal / maxVal) * 100 : 0} variant="amber" />
        <MetricPill label="Custos" pct={maxVal > 0 ? (custosTotal / maxVal) * 100 : 0} variant="dark" />
        <MetricPill label="Margem Média" pct={margem} variant="stripe" />
        <MetricPill label="Resultado" pct={receitaTotal > 0 ? Math.max(0, (resultado / receitaTotal) * 100) : 0} variant="light" />
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[200px_1fr_1fr_200px] gap-3 mb-3">

        {/* Col 1 — Dark summary */}
        <div className="bg-zinc-900 rounded-2xl p-5 flex flex-col justify-between text-white min-h-[220px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center mb-3 overflow-hidden shrink-0">
              {perfil?.logo_url ? (
                <img src={perfil.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-zinc-900 font-black text-lg">P</span>
              )}
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

        {/* Col 2 — Fluxo semanal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Fluxo Semanal</p>
              <p className="text-3xl font-black text-zinc-900 mt-0.5 leading-none">{fmtShort(receitaTotal)}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Receita este mês</p>
            </div>
            <Link href="/relatorios">
              <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
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

        {/* Col 3 — P. Equilíbrio */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">P. Equilíbrio</p>
            <Link href="/relatorios">
              <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ArrowUpRight size={14} className="text-zinc-500" />
              </button>
            </Link>
          </div>
          <CircularGauge pct={pePct} centerTop={`${pePct.toFixed(0)}%`} centerBot="faturado" />
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
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <TrendingDown size={14} className="text-zinc-500" />
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock size={14} className="text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Col 4 — Saúde das margens */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Saúde</p>
            <span className="text-3xl font-black text-zinc-900 leading-none">{margem.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">margem média</p>
          <div className="space-y-3">
            {[
              { label: "Saudáveis", count: saudaveis, pct: saudavelPct, color: "#4ADE80" },
              { label: "Atenção", count: atencao, pct: totalP > 0 ? (atencao / totalP) * 100 : 0, color: "#F59E0B" },
              { label: "Críticos", count: criticos, pct: totalP > 0 ? (criticos / totalP) * 100 : 0, color: "#F87171" },
            ].map(({ label, count, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-xs font-bold" style={{ color }}>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[200px_1fr_200px] gap-3">

        {/* Col 1 — Despesas accordion */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-3">Despesas Fixas</p>
          {!despCats || Object.keys(despCats).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-400">Nenhuma despesa</p>
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

        {/* Col 2 — Lançamentos recentes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
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
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${l.tipo === "receita" ? "bg-green-100" : "bg-red-100"}`}>
                    {l.tipo === "receita" ? <TrendingUp size={15} className="text-green-600" /> : <TrendingDown size={15} className="text-red-500" />}
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

        {/* Col 3 — Top produtos */}
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
                    {healthy ? <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                      : warn ? <CheckCircle2 size={15} className="text-zinc-500 shrink-0" />
                      : <Circle size={15} className="text-zinc-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{p.nome}</p>
                      <p className="text-[10px] text-zinc-500">{p.margem_pct.toFixed(1)}% margem</p>
                    </div>
                  </div>
                );
              })}
              <Link href="/relatorios" className="block mt-3 text-xs text-amber-400 font-semibold hover:underline">
                Ver ranking →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
