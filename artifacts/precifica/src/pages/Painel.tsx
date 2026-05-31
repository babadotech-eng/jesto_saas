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
  ShoppingCart, Wallet, Activity,
  Home, Users, Zap, Wifi, FileText, Settings2,
  ShoppingBag, Heart, AlertTriangle, AlertCircle,
} from "lucide-react";

/* ── palette ─────────────────────────────────────────────────── */
const PC = {
  primary:     "#7c5cbf",
  light:       "#a37ee8",
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

/* ── formatters ──────────────────────────────────────────────── */
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

/* ── reference data ──────────────────────────────────────────── */
const CHART_DATA = [
  { date: "18/mai", value: 2200 },
  { date: "19/mai", value: 3400 },
  { date: "20/mai", value: 2800 },
  { date: "21/mai", value: 3000 },
  { date: "22/mai", value: 4800 },
  { date: "23/mai", value: 6320 },
  { date: "24/mai", value: 4100 },
];

const MOCK_TRANSACTIONS = [
  { id: 1, name: "Venda - Balcão",   type: "Receita",      date: "24/mai · 10:42", value:  320.00, positive: true,  Icon: ShoppingCart },
  { id: 2, name: "Venda - iFood",    type: "Receita",      date: "24/mai · 09:15", value:  185.60, positive: true,  Icon: ShoppingBag  },
  { id: 3, name: "Compra - Frango",  type: "Insumos",      date: "24/mai · 08:30", value:  154.80, positive: false, Icon: ShoppingCart },
  { id: 4, name: "Aluguel",          type: "Despesa fixa", date: "24/mai · 07:45", value: 1200.00, positive: false, Icon: Home         },
  { id: 5, name: "Energia elétrica", type: "Despesa fixa", date: "23/mai · 18:22", value:  320.00, positive: false, Icon: Zap          },
];

const MOCK_EXPENSES = [
  { Icon: Home,      label: "Aluguel",          value: 1200 },
  { Icon: Users,     label: "Salários",          value: 4800 },
  { Icon: Zap,       label: "Energia elétrica",  value:  320 },
  { Icon: Wifi,      label: "Internet",          value:  120 },
  { Icon: FileText,  label: "Contador",          value:  250 },
  { Icon: Settings2, label: "Outras despesas",   value:  310 },
];

const MOCK_PRODUCTS = [
  { rank: 1, name: "Marmitex Tradicional", units: 312 },
  { rank: 2, name: "Coxinha",              units: 285 },
  { rank: 3, name: "Brigadeiro Gourmet",   units: 210 },
  { rank: 4, name: "Refrigerante Lata",    units: 198 },
  { rank: 5, name: "Bolo no Pote",         units: 162 },
];

/* ── card shell ──────────────────────────────────────────────── */
function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", ...style }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold mb-3" style={{ color: PC.textPrimary }}>{children}</p>;
}

/* ── KPI card ────────────────────────────────────────────────── */
function KPICard({ Icon, iconBg, label, value, change, up }: {
  Icon: React.ElementType; iconBg: string; label: string; value: string; change: string; up: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
      style={{ background: PC.surface, border: `1px solid ${PC.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-none mb-1" style={{ color: PC.textMuted }}>{label}</p>
        <p className="text-base font-black leading-tight" style={{ color: PC.textPrimary }}>{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {up
            ? <TrendingUp size={10} style={{ color: PC.positive }} />
            : <TrendingDown size={10} style={{ color: PC.negative }} />}
          <span className="text-[10px] font-semibold" style={{ color: up ? PC.positive : PC.negative }}>{change}</span>
          <span className="text-[10px]" style={{ color: PC.textMuted }}>vs mês ant.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Resultado do mês ────────────────────────────────────────── */
function ResultadoCard({ resultado }: { resultado: number }) {
  const isPos = resultado >= 0;
  const mainNum = fmt(Math.abs(resultado));
  return (
    <div className="rounded-2xl p-5 flex flex-col relative overflow-hidden h-full"
      style={{ background: "linear-gradient(150deg, #4f3d82 0%, #7455aa 55%, #9878cc 100%)", minHeight: 300 }}>

      {/* lighthouse silhouette */}
      <svg viewBox="0 0 60 110" fill="white"
        style={{ position: "absolute", bottom: 0, right: 12, width: 56, opacity: 0.18, pointerEvents: "none" }}>
        {/* base */}
        <rect x="18" y="90" width="24" height="20" rx="2" />
        {/* body */}
        <path d="M24 90 L26.5 36 L33.5 36 L36 90 Z" />
        {/* door */}
        <rect x="27" y="72" width="6" height="10" rx="1.5" />
        {/* windows */}
        <circle cx="30" cy="58" r="2.5" />
        <circle cx="30" cy="47" r="2" />
        {/* light room */}
        <rect x="24" y="24" width="12" height="13" rx="1.5" />
        {/* cap */}
        <polygon points="30,12 22,24 38,24" />
        {/* top dot */}
        <circle cx="30" cy="10" r="2" />
        {/* light rays */}
        <line x1="36" y1="29" x2="54" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="36" y1="31" x2="56" y2="31" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="24" y1="29" x2="6"  y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div className="relative z-10 flex flex-col h-full">
        <p className="text-[11px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>Resultado do mês</p>

        <p className="text-2xl font-black text-white leading-none mb-2">
          {isPos ? "" : "-"}{mainNum}
        </p>

        <span className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-[10px] font-semibold mb-4"
          style={{ background: "rgba(0,0,0,0.22)", color: isPos ? "#86efac" : "#fca5a5" }}>
          {isPos ? "↑" : "↓"} {isPos ? "+12,1%" : "-12,1%"} vs mês anterior
        </span>

        <div className="border-t border-white/10 my-1" />

        <div className="flex items-start gap-2.5 mt-4 flex-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.13)" }}>
            <AlertTriangle size={14} className="text-yellow-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-snug">Revise seus custos</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>para melhorar o resultado.</p>
          </div>
        </div>

        <Link href="/relatorios">
          <button className="mt-4 w-full h-9 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.22)" }}>
            Ver onde melhorar
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ── chart tooltip ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl text-white"
      style={{ background: PC.dark, border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      <p className="text-sm font-bold">{fmt(payload[0].value)}</p>
    </div>
  );
}

/* ── donut ───────────────────────────────────────────────────── */
function DonutCard({ pct, faltam }: { pct: number; faltam: number }) {
  const safe = Math.min(100, Math.max(0, pct));
  const data = [{ v: safe }, { v: 100 - safe }];
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Ponto de equilíbrio</CardTitle>
        <Info size={13} style={{ color: PC.textMuted }} />
      </div>
      <div className="relative flex items-center justify-center" style={{ height: 160 }}>
        <PieChart width={160} height={160}>
          <Pie data={data} cx={80} cy={80} innerRadius={52} outerRadius={74}
            startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}>
            <Cell fill={PC.primary} />
            <Cell fill="#e8e4f0" />
          </Pie>
        </PieChart>
        {/* amber marker at ~72% */}
        <div className="absolute" style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "#f59e0b",
          border: "2px solid white",
          top: "50%", left: "50%",
          transform: `translate(-50%, -50%) rotate(${-72 * 3.6}deg) translateY(-74px) rotate(${72 * 3.6}deg)`,
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black" style={{ color: PC.textPrimary }}>{safe.toFixed(0)}%</span>
          <span className="text-xs" style={{ color: PC.textMuted }}>atingido</span>
        </div>
      </div>
      <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: PC.textMuted }}>
        Faltam <span className="font-semibold" style={{ color: PC.textPrimary }}>
          {faltam > 0 ? fmt(faltam) : "R$ 7.120,00"}
        </span> para alcançar o ponto de equilíbrio este mês.
      </p>
      <Link href="/relatorios" className="text-[11px] font-semibold text-center mt-3 block hover:underline" style={{ color: PC.primary }}>
        Ver detalhes
      </Link>
    </Card>
  );
}

/* ── saúde ───────────────────────────────────────────────────── */
function SaudeCard({ saudaveis, atencao, criticos }: { saudaveis: number; atencao: number; criticos: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>Saúde do negócio</CardTitle>
        <Info size={13} style={{ color: PC.textMuted }} />
      </div>
      <div className="rounded-xl p-3 flex items-center gap-2.5 mb-4"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#22c55e" }}>
          <Heart size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: "#15803d" }}>Saudável</p>
          <p className="text-[10px] leading-tight" style={{ color: "#16a34a" }}>Seu negócio está no caminho certo!</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { Icon: Activity,     color: "#22c55e", bg: "#dcfce7", label: "Saudável", count: saudaveis },
          { Icon: AlertTriangle,color: "#f59e0b", bg: "#fef9c3", label: "Atenção",  count: atencao   },
          { Icon: AlertCircle,  color: "#ef4444", bg: "#fee2e2", label: "Urgente",  count: criticos  },
        ].map(({ Icon, color, bg, label, count }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: bg }}>
                <Icon size={11} style={{ color }} />
              </div>
              <span className="text-sm" style={{ color: PC.textPrimary }}>{label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>
      <Link href="/relatorios" className="text-[11px] font-semibold mt-4 flex items-center gap-1 hover:underline" style={{ color: PC.primary }}>
        Ver todos os indicadores <ArrowRight size={10} />
      </Link>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
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

  const greeting    = getGreeting();
  const displayName = perfil?.nome_completo?.trim().split(" ")[0]
    || perfil?.nome_negocio
    || user?.email?.split("@")[0]
    || "";

  /* KPI values — real when available, reference mock otherwise */
  const receitaTotal = summary?.receita_total  ?? 28540;
  const custosTotal  = summary?.custos_totais  ?? 22350;
  const margem       = summary?.margem_media   ?? 21.7;
  const resultado    = summary?.resultado_mes  ?? -3810;

  /* PE */
  const hasPE   = pe && pe.ponto_contabil > 0;
  const pePct   = hasPE ? Math.min(100, (receitaTotal / pe.ponto_contabil) * 100) : 72;
  const faltamPE = hasPE ? Math.max(0, pe.ponto_contabil - receitaTotal) : 7120;

  /* health */
  const totalP    = topProdutos.length;
  const saudaveis = totalP > 0 ? topProdutos.filter(p => p.margem_pct >= 30).length : 3;
  const atencao   = totalP > 0 ? topProdutos.filter(p => p.margem_pct >= 15 && p.margem_pct < 30).length : 2;
  const criticos  = totalP > 0 ? topProdutos.filter(p => p.margem_pct < 15).length : 1;

  /* transactions */
  const txRows = lancamentos.length > 0
    ? lancamentos.slice(0, 5).map(l => ({
        id:       l.id,
        name:     l.descricao,
        type:     l.tipo === "receita" ? "Receita" : "Despesa",
        date:     new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        value:    l.valor,
        positive: l.tipo === "receita",
        Icon:     l.tipo === "receita" ? ShoppingCart : Home,
      }))
    : MOCK_TRANSACTIONS;

  /* expenses */
  const despesaRows = despesas.length > 0
    ? despesas.slice(0, 6).map((d, i) => ({ Icon: MOCK_EXPENSES[i]?.Icon ?? FileText, label: d.categoria ?? "Despesa", value: d.valor }))
    : MOCK_EXPENSES;
  const despesasTotal = despesas.length > 0 ? despesas.reduce((s, d) => s + d.valor, 0) : 7000;

  /* products */
  const prodRows = topProdutos.length > 0
    ? topProdutos.slice(0, 5).map((p, i) => ({ rank: i + 1, name: p.nome, units: Math.round(p.margem_pct * 3.5) }))
    : MOCK_PRODUCTS;
  const maxUnits = prodRows[0]?.units || 1;

  return (
    <div className="-m-5 p-5 min-h-full" style={{ background: PC.bg }} data-testid="painel-page">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black" style={{ color: PC.textPrimary }}>
            {greeting}{displayName ? `, ${displayName}` : ""} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: PC.textMuted }}>
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KPICard Icon={Wallet}    iconBg="#0d9488" label="Receita do mês"  value={fmt(receitaTotal)}        change="↑ 8,6%"     up={true}  />
          <KPICard Icon={ShoppingCart} iconBg="#ef4444" label="Custos do mês"   value={fmt(custosTotal)}     change="↑ 5,3%"     up={false} />
          <KPICard Icon={Activity}  iconBg="#f59e0b" label="Margem média"    value={`${margem.toFixed(1)}%`} change="↑ 2,4 p.p." up={true}  />
          <KPICard Icon={TrendingDown} iconBg="#7c5cbf" label="Resultado do mês" value={fmt(resultado)}      change="↓ -12,1%"   up={resultado >= 0} />
        </div>
      </div>

      {/* ── ROW 1 — 4 cols ─────────────────────────────────────── */}
      <div
        className="gap-4 mb-4"
        style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr" }}
      >
        {/* 1: Resultado do mês */}
        <ResultadoCard resultado={resultado} />

        {/* 2: Line chart */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold" style={{ color: PC.textPrimary }}>Receita dos últimos 7 dias</p>
              <Info size={12} style={{ color: PC.textMuted }} />
            </div>
            <button className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg"
              style={{ background: PC.bg, color: PC.textMuted, border: `1px solid ${PC.border}` }}>
              Últimos 7 dias
              <svg width="9" height="5" viewBox="0 0 9 5"><path d="M1 1l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
            </button>
          </div>
          <div style={{ flex: 1, height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={PC.primary} stopOpacity={0.20} />
                    <stop offset="100%" stopColor={PC.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: PC.textMuted }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: PC.textMuted }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v === 0 ? "R$ 0" : `R$ ${v / 1000} mil`}
                  domain={[0, 8000]}
                  ticks={[0, 2000, 4000, 6000, 8000]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="value"
                  stroke={PC.primary} strokeWidth={2.5}
                  fill="url(#chartFill)"
                  dot={{ fill: PC.primary, strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: PC.primary, r: 5, strokeWidth: 2.5, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3: Donut */}
        <DonutCard pct={pePct} faltam={faltamPE} />

        {/* 4: Saúde */}
        <SaudeCard saudaveis={saudaveis} atencao={atencao} criticos={criticos} />
      </div>

      {/* ── ROW 2 — 3 cols ─────────────────────────────────────── */}
      <div
        className="gap-4"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr" }}
      >
        {/* 1: Transações recentes */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Transações recentes</CardTitle>
            <Link href="/lancamentos" className="text-[11px] font-semibold hover:underline" style={{ color: PC.primary }}>Ver todas</Link>
          </div>
          <div className="space-y-1.5">
            {txRows.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#f9f8fc] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: tx.positive ? "#dcfce7" : "#fee2e2" }}>
                  <tx.Icon size={15} style={{ color: tx.positive ? "#16a34a" : "#dc2626" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: PC.textPrimary }}>{tx.name}</p>
                  <p className="text-[10px]" style={{ color: PC.textMuted }}>
                    <span className="font-medium" style={{ color: PC.textMuted }}>{tx.type}</span>
                    &nbsp;&nbsp;{tx.date}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0 tabular-nums"
                  style={{ color: tx.positive ? PC.positive : PC.negative }}>
                  {tx.positive ? "" : "-"}{fmt(tx.value)}
                </span>
              </div>
            ))}
          </div>
          <Link href="/lancamentos" className="text-[11px] font-semibold mt-3 flex items-center gap-1 hover:underline" style={{ color: PC.primary }}>
            Ver todas as transações <ArrowRight size={10} />
          </Link>
        </Card>

        {/* 2: Despesas fixas */}
        <Card>
          <CardTitle>Despesas fixas mensais</CardTitle>
          <div className="space-y-3">
            {despesaRows.map(d => (
              <div key={d.label} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: PC.bg }}>
                  <d.Icon size={13} style={{ color: PC.textMuted }} />
                </div>
                <span className="text-sm flex-1 truncate" style={{ color: PC.textPrimary }}>{d.label}</span>
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: PC.textPrimary }}>
                  {fmt(d.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t mt-3 pt-3" style={{ borderColor: PC.border }}>
            <span className="text-sm font-bold" style={{ color: PC.textPrimary }}>Total</span>
            <span className="text-sm font-black tabular-nums" style={{ color: PC.textPrimary }}>{fmt(despesasTotal)}</span>
          </div>
        </Card>

        {/* 3: Produtos mais vendidos */}
        <div className="rounded-2xl p-5" style={{ background: PC.dark }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Produtos mais vendidos</p>
          </div>
          <div className="space-y-3.5">
            {prodRows.map(p => (
              <div key={p.rank}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold w-3 shrink-0 text-right" style={{ color: "rgba(255,255,255,0.28)" }}>{p.rank}</span>
                  <span className="text-xs font-medium flex-1 text-white truncate">{p.name}</span>
                  <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "rgba(255,255,255,0.38)" }}>{p.units} un.</span>
                </div>
                <div className="ml-5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${(p.units / maxUnits) * 100}%`, background: `linear-gradient(to right, ${PC.primary}, ${PC.light})` }} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/produtos" className="text-[11px] font-semibold mt-4 flex items-center gap-1 hover:underline" style={{ color: PC.light }}>
            Ver todos os produtos <ArrowRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}
