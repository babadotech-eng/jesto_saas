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

/* ── exact design tokens ──────────────────────────────────── */
const T = {
  bgPage:         "#F5F2ED",
  bgCard:         "#FFFFFF",
  bgDark:         "#1A1D2E",
  bgResultTop:    "#D9D0E3",
  bgResultMid:    "#CFC4DC",
  bgResultBot:    "#B8A9CA",
  borderSoft:     "#E9E2DA",
  textPrimary:    "#1F2230",
  textSecondary:  "#6F6B78",
  textMuted:      "#8D8794",
  plumPrimary:    "#4D2F70",
  plumSecondary:  "#6E4B97",
  plumSoft:       "#8D74B3",
  plumMist:       "#D8CEE5",
  success:        "#3F8F63",
  successSoft:    "#EAF7EF",
  danger:         "#C95C5C",
  dangerSoft:     "#FBEAEA",
  warning:        "#F2B544",
  warningMid:     "#FFF4DE",
  iconGreen:      "#5AAE7F",
  iconRed:        "#E2775E",
  iconOrange:     "#F2B544",
  iconPurple:     "#8C6BC2",
  shadow:         "0 6px 24px rgba(25,24,33,0.05)",
  shadowSoft:     "0 4px 14px rgba(25,24,33,0.04)",
};

/* ── formatters ───────────────────────────────────────────── */
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

/* ── static data ──────────────────────────────────────────── */
const CHART_DATA = [
  { date: "18/mai", value: 2200 },
  { date: "19/mai", value: 3400 },
  { date: "20/mai", value: 2800 },
  { date: "21/mai", value: 3000 },
  { date: "22/mai", value: 4800 },
  { date: "23/mai", value: 6320 },
  { date: "24/mai", value: 4100 },
];

const MOCK_TX = [
  { id: 1, name: "Venda - Balcão",   type: "Receita",      date: "24/mai · 10:42", value:  320.00, pos: true,  Icon: ShoppingCart },
  { id: 2, name: "Venda - iFood",    type: "Receita",      date: "24/mai · 09:15", value:  185.60, pos: true,  Icon: ShoppingBag  },
  { id: 3, name: "Compra - Frango",  type: "Insumos",      date: "24/mai · 08:30", value:  154.80, pos: false, Icon: ShoppingCart },
  { id: 4, name: "Aluguel",          type: "Despesa fixa", date: "24/mai · 07:45", value: 1200.00, pos: false, Icon: Home         },
  { id: 5, name: "Energia elétrica", type: "Despesa fixa", date: "23/mai · 18:22", value:  320.00, pos: false, Icon: Zap          },
];

const MOCK_EXP = [
  { Icon: Home,      label: "Aluguel",          value: 1200 },
  { Icon: Users,     label: "Salários",          value: 4800 },
  { Icon: Zap,       label: "Energia elétrica",  value:  320 },
  { Icon: Wifi,      label: "Internet",          value:  120 },
  { Icon: FileText,  label: "Contador",          value:  250 },
  { Icon: Settings2, label: "Outras despesas",   value:  310 },
];

const MOCK_PROD = [
  { rank: 1, name: "Marmitex Tradicional", units: 312 },
  { rank: 2, name: "Coxinha",              units: 285 },
  { rank: 3, name: "Brigadeiro Gourmet",   units: 210 },
  { rank: 4, name: "Refrigerante Lata",    units: 198 },
  { rank: 5, name: "Bolo no Pote",         units: 162 },
];

/* ── shared card wrapper ─────────────────────────────────── */
function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

/* ── KPI card ────────────────────────────────────────────── */
function KPICard({ Icon, iconBg, iconColor, label, value, change, up }: {
  Icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; value: string; change: string; up: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
      style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadowSoft }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}>
        <Icon size={17} style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-none mb-1" style={{ color: T.textSecondary }}>{label}</p>
        <p className="text-base font-black leading-tight" style={{ color: T.textPrimary }}>{value}</p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {up
            ? <TrendingUp size={10} style={{ color: T.success, flexShrink: 0 }} />
            : <TrendingDown size={10} style={{ color: T.danger, flexShrink: 0 }} />}
          <span className="text-[10px] font-semibold" style={{ color: up ? T.success : T.danger }}>{change}</span>
          <span className="text-[10px]" style={{ color: T.textMuted }}>vs mês ant.</span>
        </div>
      </div>
    </div>
  );
}

/* ── Resultado do mês ────────────────────────────────────── */
function ResultadoCard({ resultado }: { resultado: number }) {
  const isPos = resultado >= 0;
  /* use reference values when no real data */
  const displayValue = resultado !== 0 ? resultado : -3810;
  const displayPos   = displayValue >= 0;

  return (
    <div
      className="flex flex-col relative overflow-hidden h-full"
      style={{
        borderRadius: 24,
        isolation: "isolate",
        padding: "22px 20px 20px",
        minHeight: 290,
        /* layered misty background */
        background: [
          "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.00) 48%, rgba(120,101,148,0.10) 100%)",
          "radial-gradient(circle at 55% 72%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 38%)",
          "radial-gradient(circle at 78% 24%, rgba(245,240,248,0.34) 0%, rgba(245,240,248,0.00) 46%)",
          "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.00) 42%)",
          "linear-gradient(180deg, #DED7E8 0%, #CEC2DB 54%, #B7A8C9 100%)",
        ].join(", "),
        boxShadow: "0 6px 24px rgba(25,24,33,0.07)",
      }}
    >
      {/* lighthouse glow — soft radial CSS layer, sits behind silhouette */}
      <div aria-hidden="true" style={{
        position: "absolute",
        bottom: 10,
        right: -10,
        width: 120,
        height: 120,
        pointerEvents: "none",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 55% 38%, rgba(255,252,255,0.55) 0%, rgba(240,232,250,0.28) 30%, rgba(220,210,238,0.00) 72%)",
        filter: "blur(14px)",
        opacity: 0.7,
      }} />

      {/* lighthouse — small, quiet silhouette, lower-right */}
      <svg
        viewBox="0 0 80 160"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          right: 4,
          width: 58,
          pointerEvents: "none",
          opacity: 0.16,
          fill: "#6E5F81",
        }}
      >
        {/* dome */}
        <path d="M28,28 Q40,14 52,28 Z" />
        {/* lantern box */}
        <rect x="30" y="28" width="20" height="13" rx="1.5" />
        {/* gallery ledge */}
        <rect x="27" y="41" width="26" height="3" rx="1.5" />
        {/* tower — trapezoid */}
        <path d="M33,44 L30,130 L50,130 L47,44 Z" />
        {/* base */}
        <rect x="24" y="130" width="32" height="7" rx="1.5" />
        <rect x="18" y="137" width="44" height="8" rx="2" />
        {/* ground fill */}
        <rect x="8" y="145" width="64" height="15" rx="3" />
      </svg>

      {/* content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* 1 — title */}
        <p style={{ fontSize: 11, fontWeight: 500, color: "#43384E", marginBottom: 6, letterSpacing: "0.01em" }}>
          Resultado do mês
        </p>

        {/* 2 — value */}
        <p style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.05, color: "#4A2E69", marginBottom: 10 }}>
          {displayPos ? "" : "-"}{fmt(Math.abs(displayValue))}
        </p>

        {/* 3 — pill */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start",
          padding: "4px 10px", borderRadius: 999,
          fontSize: 10, fontWeight: 500, color: "#5E516C",
          background: "rgba(74,46,105,0.08)",
          border: "1px solid rgba(74,46,105,0.10)",
          marginBottom: 16,
        }}>
          {displayPos ? "↑" : "↓"} {displayPos ? "+12,1%" : "-12,1%"} vs mês anterior
        </span>

        {/* 4 — divider */}
        <div style={{ borderTop: "1px solid rgba(74,46,105,0.10)", marginBottom: 16 }} />

        {/* 5 — advisory */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(74,46,105,0.10)",
          }}>
            <AlertTriangle size={13} style={{ color: "#5A486D" }} />
          </div>
          <div style={{ paddingTop: 2 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#2E2A36", lineHeight: 1.35 }}>
              Revise seus custos
            </p>
            <p style={{ fontSize: 11, fontWeight: 400, color: "#6E6877", lineHeight: 1.4, marginTop: 2 }}>
              para melhorar o resultado.
            </p>
          </div>
        </div>

        {/* 6 — CTA */}
        <Link href="/relatorios">
          <button
            style={{
              marginTop: 18,
              display: "inline-block",
              padding: "9px 22px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "#5A347E",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4B2B69"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#5A347E"; }}
          >
            Ver onde melhorar
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ── chart tooltip ───────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2"
      style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadowSoft }}>
      <p className="text-[10px] mb-0.5" style={{ color: T.textMuted }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: T.textPrimary }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

/* ── donut ───────────────────────────────────────────────── */
function DonutCard({ pct, faltam }: { pct: number; faltam: number }) {
  const safe = Math.min(100, Math.max(0, pct));
  const data = [{ v: safe }, { v: 100 - safe }];
  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold" style={{ color: T.textPrimary }}>Ponto de equilíbrio</p>
        <Info size={13} style={{ color: T.textMuted }} />
      </div>
      <div className="relative flex items-center justify-center my-2" style={{ height: 155 }}>
        <PieChart width={155} height={155}>
          <Pie data={data} cx={77.5} cy={77.5}
            innerRadius={50} outerRadius={70}
            startAngle={90} endAngle={-270}
            dataKey="v" strokeWidth={0}>
            <Cell fill={T.plumPrimary} />
            <Cell fill="#ECE7F0" />
          </Pie>
        </PieChart>
        {/* warning dot marker */}
        <div style={{
          position: "absolute",
          width: 9, height: 9,
          borderRadius: "50%",
          background: T.warning,
          border: "2px solid white",
          top: "calc(50% - 70px)",
          left: "50%",
          transform: "translateX(-50%) rotate(0deg)",
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black" style={{ color: T.textPrimary }}>{safe.toFixed(0)}%</span>
          <span className="text-xs" style={{ color: T.textSecondary }}>atingido</span>
        </div>
      </div>
      <p className="text-[11px] text-center leading-relaxed" style={{ color: T.textSecondary }}>
        Faltam{" "}
        <span className="font-semibold" style={{ color: T.textPrimary }}>
          {faltam > 0 ? fmt(faltam) : "R$ 7.120,00"}
        </span>{" "}
        para alcançar o ponto de equilíbrio este mês.
      </p>
      <Link href="/relatorios"
        className="text-[11px] font-semibold text-center mt-2.5 block hover:underline"
        style={{ color: T.plumPrimary }}>
        Ver detalhes
      </Link>
    </Card>
  );
}

/* ── saúde ───────────────────────────────────────────────── */
function SaudeCard({ s, a, c }: { s: number; a: number; c: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold" style={{ color: T.textPrimary }}>Saúde do negócio</p>
        <Info size={13} style={{ color: T.textMuted }} />
      </div>
      {/* green banner */}
      <div className="rounded-xl p-3 flex items-center gap-2.5 mb-3"
        style={{ background: T.successSoft, border: "1px solid #D5EEDB" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#DDF3E5" }}>
          <Heart size={14} style={{ color: T.success }} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: "#2F7D53" }}>Saudável</p>
          <p className="text-[10px]" style={{ color: "#4D7B60" }}>Seu negócio está no caminho certo!</p>
        </div>
      </div>
      {/* rows */}
      <div className="space-y-2.5">
        {[
          { Icon: Activity,      bg: "#EAF7EF", color: T.success,  label: "Saudável", count: s },
          { Icon: AlertTriangle, bg: "#FFF4DE", color: T.warning,  label: "Atenção",  count: a },
          { Icon: AlertCircle,   bg: "#FBEAEA", color: T.danger,   label: "Urgente",  count: c },
        ].map(({ Icon, bg, color, label, count }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: bg }}>
                <Icon size={11} style={{ color }} />
              </div>
              <span className="text-sm" style={{ color: T.textPrimary }}>{label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>
      <Link href="/relatorios"
        className="text-[11px] font-semibold mt-3 flex items-center gap-1 hover:underline"
        style={{ color: T.plumPrimary }}>
        Ver todos os indicadores <ArrowRight size={10} />
      </Link>
    </Card>
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

  /* real or reference values */
  const receitaTotal = summary?.receita_total  ?? 28540;
  const custosTotal  = summary?.custos_totais  ?? 22350;
  const margem       = summary?.margem_media   ?? 21.7;
  const resultado    = summary?.resultado_mes  ?? -3810;

  const hasPE    = pe && pe.ponto_contabil > 0;
  const pePct    = hasPE ? Math.min(100, (receitaTotal / pe.ponto_contabil) * 100) : 72;
  const faltamPE = hasPE ? Math.max(0, pe.ponto_contabil - receitaTotal) : 7120;

  const totalP    = topProdutos.length;
  const saudaveis = totalP > 0 ? topProdutos.filter(p => p.margem_pct >= 30).length  : 3;
  const atencao   = totalP > 0 ? topProdutos.filter(p => p.margem_pct >= 15 && p.margem_pct < 30).length : 2;
  const criticos  = totalP > 0 ? topProdutos.filter(p => p.margem_pct < 15).length  : 1;

  const txRows = lancamentos.length > 0
    ? lancamentos.slice(0, 5).map(l => ({
        id: l.id, name: l.descricao,
        type: l.tipo === "receita" ? "Receita" : "Despesa",
        date: new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        value: l.valor, pos: l.tipo === "receita",
        Icon: l.tipo === "receita" ? ShoppingCart : Home,
      }))
    : MOCK_TX;

  const expRows   = despesas.length > 0
    ? despesas.slice(0, 6).map((d, i) => ({ Icon: MOCK_EXP[i]?.Icon ?? FileText, label: d.categoria ?? "Despesa", value: d.valor }))
    : MOCK_EXP;
  const expTotal  = despesas.length > 0 ? despesas.reduce((s, d) => s + d.valor, 0) : 7000;

  const prodRows  = topProdutos.length > 0
    ? topProdutos.slice(0, 5).map((p, i) => ({ rank: i + 1, name: p.nome, units: Math.round(p.margem_pct * 3.5) }))
    : MOCK_PROD;
  const maxUnits  = prodRows[0]?.units || 1;

  return (
    <div className="-m-5 p-5 min-h-full" style={{ background: T.bgPage }} data-testid="painel-page">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-black" style={{ color: T.textPrimary }}>
            {greeting}{displayName ? `, ${displayName}` : ""} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: T.textSecondary }}>
            Aqui está o resumo do seu negócio hoje.
          </p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KPICard Icon={Wallet}       iconBg="#EAF7EF"  iconColor={T.iconGreen}  label="Receita do mês"   value={fmt(receitaTotal)}        change="↑ 8,6%"     up={true}  />
          <KPICard Icon={ShoppingCart} iconBg="#FDEEE8"  iconColor={T.iconRed}    label="Custos do mês"    value={fmt(custosTotal)}         change="↑ 5,3%"     up={false} />
          <KPICard Icon={Activity}     iconBg="#FFF4DE"  iconColor={T.iconOrange} label="Margem média"     value={`${margem.toFixed(1)}%`}  change="↑ 2,4 p.p." up={true}  />
          <KPICard Icon={TrendingDown} iconBg="#F1EAFE"  iconColor={T.iconPurple} label="Resultado do mês" value={fmt(resultado)}           change="↓ -12,1%"   up={resultado >= 0} />
        </div>
      </div>

      {/* ── ROW 1 — 4 cols ──────────────────────────────────── */}
      <div className="gap-4 mb-4"
        style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr" }}>

        {/* 1 — Resultado do mês */}
        <ResultadoCard resultado={resultado} />

        {/* 2 — Line / area chart */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold" style={{ color: T.textPrimary }}>Receita dos últimos 7 dias</p>
              <Info size={12} style={{ color: T.textMuted }} />
            </div>
            <button className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: "#F7F3EE", color: T.textSecondary, border: `1px solid ${T.borderSoft}` }}>
              Últimos 7 dias
              <svg width="9" height="5" viewBox="0 0 9 5"><path d="M1 1l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
            </button>
          </div>
          <div style={{ flex: 1, height: 205 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.plumPrimary} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={T.plumPrimary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE7DF" vertical={false} />
                <XAxis dataKey="date"
                  tick={{ fontSize: 10, fill: T.textMuted }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: T.textMuted }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v === 0 ? "R$ 0" : `R$ ${v / 1000} mil`}
                  domain={[0, 8000]} ticks={[0, 2000, 4000, 6000, 8000]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value"
                  stroke={T.plumPrimary} strokeWidth={2.5}
                  fill="url(#areaFill)"
                  dot={{ fill: T.plumPrimary, strokeWidth: 2, stroke: "#fff", r: 4 }}
                  activeDot={{ fill: T.plumPrimary, r: 5, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3 — Donut */}
        <DonutCard pct={pePct} faltam={faltamPE} />

        {/* 4 — Saúde */}
        <SaudeCard s={saudaveis} a={atencao} c={criticos} />
      </div>

      {/* ── ROW 2 — 3 cols ──────────────────────────────────── */}
      <div className="gap-4"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr" }}>

        {/* 1 — Transações recentes */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: T.textPrimary }}>Transações recentes</p>
            <Link href="/lancamentos"
              className="text-[11px] font-semibold hover:underline"
              style={{ color: T.plumPrimary }}>Ver todas</Link>
          </div>
          <div className="space-y-1">
            {txRows.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-[#FAF7F4]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: tx.pos ? T.successSoft : T.dangerSoft }}>
                  <tx.Icon size={15} style={{ color: tx.pos ? T.success : T.danger }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: T.textPrimary }}>{tx.name}</p>
                  <p className="text-[10px]" style={{ color: T.textMuted }}>
                    <span style={{ color: T.textSecondary }}>{tx.type}</span>
                    {"  "}{tx.date}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0 tabular-nums"
                  style={{ color: tx.pos ? T.success : T.danger }}>
                  {tx.pos ? "" : "-"}{fmt(tx.value)}
                </span>
              </div>
            ))}
          </div>
          <Link href="/lancamentos"
            className="text-[11px] font-semibold mt-3 flex items-center gap-1 hover:underline"
            style={{ color: T.plumPrimary }}>
            Ver todas as transações <ArrowRight size={10} />
          </Link>
        </Card>

        {/* 2 — Despesas fixas */}
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.textPrimary }}>Despesas fixas mensais</p>
          <div className="space-y-2.5">
            {expRows.map(d => (
              <div key={d.label} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#F7F3EE" }}>
                  <d.Icon size={13} style={{ color: T.textPrimary }} />
                </div>
                <span className="text-sm flex-1 truncate" style={{ color: T.textPrimary }}>{d.label}</span>
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: T.textPrimary }}>
                  {fmt(d.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t mt-3 pt-3"
            style={{ borderColor: T.borderSoft }}>
            <span className="text-sm font-bold" style={{ color: T.textPrimary }}>Total</span>
            <span className="text-sm font-black tabular-nums" style={{ color: T.textPrimary }}>{fmt(expTotal)}</span>
          </div>
        </Card>

        {/* 3 — Produtos mais vendidos */}
        <div className="rounded-2xl p-5" style={{ background: T.bgDark, boxShadow: T.shadow }}>
          <p className="text-sm font-bold text-white mb-4">Produtos mais vendidos</p>
          <div className="space-y-3.5">
            {prodRows.map(p => (
              <div key={p.rank}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold w-3 text-right shrink-0"
                    style={{ color: "#B9AFCB" }}>{p.rank}</span>
                  <span className="text-xs font-medium flex-1 text-white truncate">{p.name}</span>
                  <span className="text-[10px] shrink-0 tabular-nums"
                    style={{ color: "#B9AFCB" }}>{p.units} un.</span>
                </div>
                <div className="ml-5 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.10)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(p.units / maxUnits) * 100}%`,
                      background: T.plumSoft,
                    }} />
                </div>
              </div>
            ))}
          </div>
          <Link href="/produtos"
            className="text-[11px] font-semibold mt-4 flex items-center gap-1 hover:underline"
            style={{ color: "#E2D7F1" }}>
            Ver todos os produtos <ArrowRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}
