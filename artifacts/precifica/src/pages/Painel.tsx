import {
  useGetDashboardSummary,
  useGetTopProdutos,
  useGetPontoEquilibrio,
  useListDespesas,
  useListLancamentos,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { usePerfil } from "@/hooks/usePerfil";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, Info, ArrowRight,
  ShoppingCart, Wallet, BarChart3, Activity,
  Home, Users, Zap, Wifi, FileText, Settings2,
  ShoppingBag, Heart, AlertTriangle, AlertCircle,
} from "lucide-react";

/* ── plum palette ──────────────────────────────────────────── */
const PC = {
  primary:     "#7c5cbf",
  light:       "#a37ee8",
  plum:        "#4a3570",
  dark:        "#1e1a2e",
  bg:          "#f4f3f7",
  surface:     "#ffffff",
  textPrimary: "#1a1625",
  textMuted:   "#7a748a",
  positive:    "#22c55e",
  negative:    "#ef4444",
  warning:     "#f59e0b",
  border:      "#e8e4f0",
};

/* ── formatters ────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return `R$\u00a0${(n / 1000).toFixed(1)}k`;
  return fmt(n);
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/* ── mock data ─────────────────────────────────────────────── */
const CHART_DATA = [
  { date: "18/mai", value: 3200 },
  { date: "19/mai", value: 2800 },
  { date: "20/mai", value: 4100 },
  { date: "21/mai", value: 3600 },
  { date: "22/mai", value: 3900 },
  { date: "23/mai", value: 6320 },
  { date: "24/mai", value: 5800 },
];

const MOCK_TRANSACTIONS = [
  { id: 1, name: "Venda - Balcão",    type: "Receita",       date: "24/mai · 10:42", value: 320.00,    positive: true,  icon: ShoppingCart },
  { id: 2, name: "Venda - iFood",     type: "Receita",       date: "24/mai · 09:15", value: 185.60,    positive: true,  icon: ShoppingBag },
  { id: 3, name: "Compra - Frango",   type: "Insumos",       date: "24/mai · 08:30", value: 154.80,    positive: false, icon: ShoppingCart },
  { id: 4, name: "Aluguel",           type: "Despesa fixa",  date: "24/mai · 07:45", value: 1200.00,   positive: false, icon: Home },
  { id: 5, name: "Energia elétrica",  type: "Despesa fixa",  date: "23/mai · 18:22", value: 320.00,    positive: false, icon: Zap },
];

const MOCK_EXPENSES = [
  { icon: Home,      label: "Aluguel",          value: 1200.00 },
  { icon: Users,     label: "Salários",          value: 4800.00 },
  { icon: Zap,       label: "Energia elétrica",  value: 320.00  },
  { icon: Wifi,      label: "Internet",          value: 120.00  },
  { icon: FileText,  label: "Contador",          value: 250.00  },
  { icon: Settings2, label: "Outras despesas",   value: 310.00  },
];
const MOCK_EXPENSES_TOTAL = MOCK_EXPENSES.reduce((s, e) => s + e.value, 0);

const MOCK_PRODUCTS = [
  { rank: 1, name: "Marmitex Tradicional",  units: 312 },
  { rank: 2, name: "Coxinha",               units: 285 },
  { rank: 3, name: "Brigadeiro Gourmet",    units: 210 },
  { rank: 4, name: "Refrigerante Lata",     units: 198 },
  { rank: 5, name: "Bolo no Pote",          units: 162 },
];
const MAX_UNITS = MOCK_PRODUCTS[0].units;

/* ── KPI card ──────────────────────────────────────────────── */
function KPICard({
  icon: Icon, iconBg, label, value, change, positive,
}: { icon: React.ElementType; iconBg: string; label: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="rounded-2xl p-4 flex gap-3 items-start min-w-0"
      style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium truncate mb-0.5" style={{ color: PC.textMuted }}>{label}</p>
        <p className="text-lg font-black leading-tight truncate" style={{ color: PC.textPrimary }}>{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {positive
            ? <TrendingUp size={10} style={{ color: PC.positive, flexShrink: 0 }} />
            : <TrendingDown size={10} style={{ color: PC.negative, flexShrink: 0 }} />}
          <span className="text-[10px] font-semibold" style={{ color: positive ? PC.positive : PC.negative }}>{change}</span>
          <span className="text-[10px]" style={{ color: PC.textMuted }}>vs mês ant.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Resultado do mês card ─────────────────────────────────── */
function ResultadoCard({ resultado, receita, custos }: { resultado: number; receita: number; custos: number }) {
  const isPositive = resultado >= 0;
  return (
    <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2d2048 0%, #3d2d5c 60%, #4a3570 100%)", minHeight: 320 }}>

      {/* Lighthouse SVG silhouette */}
      <svg viewBox="0 0 80 140" fill="white" style={{ position: "absolute", bottom: 0, right: 16, width: 70, opacity: 0.15, pointerEvents: "none" }}>
        <rect x="30" y="118" width="20" height="22" rx="2" />
        <path d="M34 118 L36.5 40 L43.5 40 L46 118 Z" />
        <rect x="33" y="28" width="14" height="14" rx="2" />
        <polygon points="40,14 30,28 50,28" />
        <line x1="47" y1="33" x2="68" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="47" y1="35" x2="72" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="33" x2="12" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Resultado do mês</p>
        <p className="text-3xl font-black text-white leading-none mb-2">
          {isPositive ? "" : "-"}R$ {Math.abs(resultado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full mb-5 text-[11px] font-semibold"
          style={{ background: "rgba(0,0,0,0.25)", color: isPositive ? "#4ade80" : "#f87171" }}>
          {isPositive ? "↑" : "↓"} {isPositive ? "+12,1%" : "-12,1%"} vs mês anterior
        </span>

        <div className="border-t border-white/10 pt-4 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Receita</span>
            <span className="text-xs font-semibold" style={{ color: "#4ade80" }}>{fmtShort(receita)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Custos</span>
            <span className="text-xs font-semibold" style={{ color: "#f87171" }}>{fmtShort(custos)}</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 flex-1 flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <AlertTriangle size={13} className="text-yellow-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-tight">Revise seus custos</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>para melhorar o resultado.</p>
            </div>
          </div>
          <Link href="/relatorios">
            <button className="mt-4 w-full h-9 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: PC.primary }}>
              Ver onde melhorar
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Custom tooltip for line chart ─────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl" style={{ background: PC.dark, border: `1px solid rgba(255,255,255,0.08)` }}>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p className="text-sm font-bold text-white">{fmt(payload[0].value)}</p>
    </div>
  );
}

/* ── Large donut ────────────────────────────────────────────── */
function DonutCard({ pct, faltam }: { pct: number; faltam: number }) {
  const safeP = Math.min(100, Math.max(0, pct));
  const data = [{ value: safeP }, { value: 100 - safeP }];
  return (
    <div className="rounded-2xl p-5 flex flex-col" style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold" style={{ color: PC.textPrimary }}>Ponto de equilíbrio</p>
        <Info size={14} style={{ color: PC.textMuted }} />
      </div>
      <div className="relative flex-1 flex items-center justify-center" style={{ height: 180 }}>
        <PieChart width={180} height={180}>
          <Pie data={data} cx={90} cy={90} innerRadius={60} outerRadius={82} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={PC.primary} />
            <Cell fill="#e8e4f0" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black" style={{ color: PC.textPrimary }}>{safeP.toFixed(0)}%</span>
          <span className="text-xs font-medium" style={{ color: PC.textMuted }}>atingido</span>
        </div>
      </div>
      <p className="text-[11px] text-center mt-2 leading-relaxed" style={{ color: PC.textMuted }}>
        Faltam <span className="font-semibold" style={{ color: PC.textPrimary }}>{faltam > 0 ? fmt(faltam) : "—"}</span> para alcançar o ponto de equilíbrio este mês.
      </p>
      <Link href="/relatorios" className="text-[11px] font-semibold text-center mt-3 block hover:underline" style={{ color: PC.primary }}>
        Ver detalhes →
      </Link>
    </div>
  );
}

/* ── Saúde do negócio ───────────────────────────────────────── */
function SaudeCard({ saudaveis, atencao, criticos }: { saudaveis: number; atencao: number; criticos: number }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col" style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold" style={{ color: PC.textPrimary }}>Saúde do negócio</p>
        <Info size={14} style={{ color: PC.textMuted }} />
      </div>

      {/* Green banner */}
      <div className="rounded-xl p-3 flex items-center gap-3 mb-4"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#22c55e" }}>
          <Heart size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#15803d" }}>Saudável</p>
          <p className="text-[11px]" style={{ color: "#16a34a" }}>Seu negócio está no caminho certo!</p>
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <Activity size={11} style={{ color: "#22c55e" }} />
            </div>
            <span className="text-sm" style={{ color: PC.textPrimary }}>Saudável</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{saudaveis}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#fef9c3" }}>
              <AlertTriangle size={11} style={{ color: "#f59e0b" }} />
            </div>
            <span className="text-sm" style={{ color: PC.textPrimary }}>Atenção</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{atencao}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#fee2e2" }}>
              <AlertCircle size={11} style={{ color: "#ef4444" }} />
            </div>
            <span className="text-sm" style={{ color: PC.textPrimary }}>Urgente</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "#ef4444" }}>{criticos}</span>
        </div>
      </div>

      <Link href="/relatorios" className="text-[11px] font-semibold mt-4 block hover:underline" style={{ color: PC.primary }}>
        Ver todos os indicadores →
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Painel() {
  const { user } = useAuth();
  const { data: perfil } = usePerfil();
  const { data: summary } = useGetDashboardSummary();
  const { data: topProdutosRaw } = useGetTopProdutos();
  const topProdutos = Array.isArray(topProdutosRaw) ? topProdutosRaw : [];
  const { data: pe } = useGetPontoEquilibrio();
  const { data: despesasRaw } = useListDespesas();
  const despesas = Array.isArray(despesasRaw) ? despesasRaw : [];
  const { data: lancamentosRaw } = useListLancamentos();
  const lancamentos = Array.isArray(lancamentosRaw) ? lancamentosRaw : [];

  const greeting = getGreeting();
  const displayName = perfil?.nome_completo?.trim().split(" ")[0]
    || perfil?.nome_negocio
    || user?.email?.split("@")[0]
    || "";

  const receitaTotal  = summary?.receita_total  ?? 0;
  const custosTotal   = summary?.custos_totais  ?? 0;
  const margem        = summary?.margem_media   ?? 0;
  const resultado     = summary?.resultado_mes  ?? 0;

  const pePct   = pe && pe.ponto_contabil > 0 ? Math.min(100, (receitaTotal / pe.ponto_contabil) * 100) : 72;
  const faltamPE = pe && pe.ponto_contabil > 0 ? Math.max(0, pe.ponto_contabil - receitaTotal) : 7120;

  const totalP    = topProdutos.length;
  const saudaveis = topProdutos.filter(p => p.margem_pct >= 30).length;
  const atencao   = topProdutos.filter(p => p.margem_pct >= 15 && p.margem_pct < 30).length;
  const criticos  = topProdutos.filter(p => p.margem_pct < 15).length;

  /* Despesas: real or mock */
  const hasDespesas = despesas.length > 0;
  const despesaRows = hasDespesas
    ? despesas.slice(0, 6).map((d, i) => ({ icon: MOCK_EXPENSES[i]?.icon ?? FileText, label: d.categoria ?? "Despesa", value: d.valor }))
    : MOCK_EXPENSES;
  const despesasTotal = hasDespesas ? despesas.reduce((s, d) => s + d.valor, 0) : MOCK_EXPENSES_TOTAL;

  /* Transactions: real or mock */
  const hasLancamentos = lancamentos.length > 0;
  const txRows = hasLancamentos
    ? lancamentos.slice(0, 5).map(l => ({
        id: l.id,
        name: l.descricao,
        type: l.tipo === "receita" ? "Receita" : "Despesa",
        date: new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        value: l.valor,
        positive: l.tipo === "receita",
        icon: l.tipo === "receita" ? ShoppingCart : Home,
      }))
    : MOCK_TRANSACTIONS;

  /* Products: real or mock */
  const prodRows = topProdutos.length > 0
    ? topProdutos.slice(0, 5).map((p, i) => ({ rank: i + 1, name: p.nome, units: Math.round(p.margem_pct * 3.5) }))
    : MOCK_PRODUCTS;
  const maxProdUnits = prodRows[0]?.units || 1;

  return (
    <div className="-m-4 sm:-m-6 p-4 sm:p-6 min-h-full" style={{ background: PC.bg }} data-testid="painel-page">

      {/* ── HEADER — greeting + 4 KPIs ─────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: PC.textPrimary }}>
            {greeting}{displayName ? `, ${displayName}` : ""} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: PC.textMuted }}>
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>

        {/* 4 KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:shrink-0">
          <KPICard icon={TrendingUp}  iconBg="#0d9488" label="Receita do mês"  value={fmtShort(receitaTotal)} change="↑ 8,6%"  positive={true}  />
          <KPICard icon={ShoppingCart} iconBg="#ef4444" label="Custos do mês"   value={fmtShort(custosTotal)}  change="↑ 5,3%"  positive={false} />
          <KPICard icon={Activity}    iconBg="#f59e0b" label="Margem média"    value={`${margem.toFixed(1)}%`} change="↑ 2,4 p.p." positive={true} />
          <KPICard icon={Wallet}      iconBg={PC.primary} label="Resultado do mês" value={fmtShort(resultado)} change="↓ 12,1%" positive={resultado >= 0} />
        </div>
      </div>

      {/* ── ROW 1: Resultado | Line chart | Donut ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Resultado do mês */}
        <ResultadoCard resultado={resultado} receita={receitaTotal} custos={custosTotal} />

        {/* Smooth line/area chart */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: PC.textPrimary }}>Receita dos últimos 7 dias</p>
              <Info size={13} style={{ color: PC.textMuted }} />
            </div>
            <button className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: PC.bg, color: PC.textMuted, border: `1px solid ${PC.border}` }}>
              Últimos 7 dias
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="flex-1" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PC.primary} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={PC.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edf8" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: PC.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: PC.textMuted }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} domain={[0, 8000]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke={PC.primary} strokeWidth={2.5}
                  fill="url(#areaGrad)" dot={{ fill: PC.primary, strokeWidth: 0, r: 3.5 }}
                  activeDot={{ fill: PC.primary, r: 5, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Large donut */}
        <DonutCard pct={pePct} faltam={faltamPE} />
      </div>

      {/* ── ROW 2: Saúde | Transações | Despesas ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Saúde do negócio */}
        <SaudeCard
          saudaveis={totalP > 0 ? saudaveis : 3}
          atencao={totalP > 0 ? atencao : 2}
          criticos={totalP > 0 ? criticos : 1}
        />

        {/* Transações recentes */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold" style={{ color: PC.textPrimary }}>Transações recentes</p>
            <Link href="/lancamentos" className="text-[11px] font-semibold hover:underline" style={{ color: PC.primary }}>Ver todas</Link>
          </div>
          <div className="space-y-2 flex-1">
            {txRows.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-[#f9f8fc]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: tx.positive ? "#dcfce7" : "#fee2e2" }}>
                  <tx.icon size={15} style={{ color: tx.positive ? "#16a34a" : "#dc2626" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: PC.textPrimary }}>{tx.name}</p>
                  <p className="text-[10px] truncate" style={{ color: PC.textMuted }}>{tx.type} · {tx.date}</p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: tx.positive ? PC.positive : PC.negative }}>
                  {tx.positive ? "+" : "-"}{fmt(tx.value)}
                </span>
              </div>
            ))}
          </div>
          <Link href="/lancamentos" className="text-[11px] font-semibold mt-3 flex items-center gap-1 hover:underline" style={{ color: PC.primary }}>
            Ver todas as transações <ArrowRight size={11} />
          </Link>
        </div>

        {/* Despesas fixas mensais */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p className="text-sm font-bold mb-4" style={{ color: PC.textPrimary }}>Despesas fixas mensais</p>
          <div className="space-y-3 flex-1">
            {despesaRows.map(d => (
              <div key={d.label} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: PC.bg }}>
                  <d.icon size={13} style={{ color: PC.textMuted }} />
                </div>
                <span className="text-sm flex-1 truncate" style={{ color: PC.textPrimary }}>{d.label}</span>
                <span className="text-sm font-semibold shrink-0 tabular-nums" style={{ color: PC.textPrimary }}>{fmt(d.value)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex items-center justify-between" style={{ borderColor: PC.border }}>
            <span className="text-sm font-bold" style={{ color: PC.textPrimary }}>Total</span>
            <span className="text-sm font-black tabular-nums" style={{ color: PC.textPrimary }}>{fmt(despesasTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Produtos mais vendidos ──────────────────── */}
      <div className="rounded-2xl p-6" style={{ background: PC.dark }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-white">Produtos mais vendidos</p>
          <Link href="/produtos" className="text-[11px] font-semibold hover:underline flex items-center gap-1" style={{ color: PC.light }}>
            Ver todos os produtos <ArrowRight size={11} />
          </Link>
        </div>
        <div className="space-y-4">
          {prodRows.map(p => (
            <div key={p.rank}>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[11px] font-bold w-4 text-right shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{p.rank}</span>
                <span className="text-sm font-medium flex-1 text-white truncate">{p.name}</span>
                <span className="text-xs shrink-0 tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{p.units} un.</span>
              </div>
              <div className="ml-7 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(p.units / maxProdUnits) * 100}%`, background: `linear-gradient(to right, ${PC.primary}, ${PC.light})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
