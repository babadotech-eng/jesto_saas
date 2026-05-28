import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Check, TrendingUp, BookOpen, Wallet, LayoutDashboard, UtensilsCrossed, Coffee, ShoppingBag, Sandwich, ArrowRight, FileSpreadsheet } from "lucide-react";
import dashboardImg from "@assets/Captura_de_tela_27-5-2026_182552_d4272d6d-2b36-4ab1-adf1-6048_1779919697917.jpeg";
import chefImg from "@assets/cheff_1779928813310.png";

/* ── palette ── */
const C = {
  bg:      "#ECEAE5",
  bg2:     "#E6E2DB",
  surface: "#F5F4F1",
  text:    "#1A1A1A",
  muted:   "#6B6864",
  border:  "#C8C3BB",
  accent:  "#E8712A",
};

/* ── smooth scroll ── */
function useSmoothScroll() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);
}

/* ── scroll reveal ── */
function useFadeUp(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, v };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, v } = useFadeUp();
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={className} style={{
      opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>{children}</div>
  );
}

/* ── back-to-top ── */
function useScrolled(threshold = 400) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return visible;
}

/* ── pricing ── */
const PRICES = { pro: { m: 19.90, a: 199.00 }, premium: { m: 39.90, a: 399.00 } };
function fmt(v: number) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

/* ── FAQ ── */
const FAQ = [
  { q: "Preciso entender de finanças para usar?",  a: "Não. O Precifica foi pensado para quem trabalha com alimentação no dia a dia, não para especialistas em finanças. Os números aparecem de forma simples e direta." },
  { q: "Serve para pequeno negócio?",               a: "Sim. A plataforma foi pensada para a realidade de marmitarias, confeitarias, restaurantes e lanchonetes que precisam organizar custos e fichas técnicas de forma prática." },
  { q: "Posso testar grátis?",                      a: "Sim. Você pode começar no plano grátis e conhecer tudo antes de decidir avançar para um plano pago." },
  { q: "Funciona no celular?",                      a: "Sim. A plataforma funciona bem em diferentes dispositivos, facilitando o acesso mesmo na correria do dia a dia." },
  { q: "Posso cancelar quando quiser?",             a: "Sim. Você gerencia sua assinatura de forma simples, sem burocracia." },
];

/* ── buttons ── */
const btnBlack   = "inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold transition-all hover:bg-[#2d2d2d] active:scale-[0.97]";
const btnOutline = "inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full text-sm font-semibold transition-all active:scale-[0.97]";

/* ── Playfair italic + orange ── */
const It = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400, color: dark ? "rgba(255,255,255,0.7)" : C.accent }}>
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  useSmoothScroll();
  const [anual, setAnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showTop = useScrolled();

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Satoshi', sans-serif", position: "relative" }}>

      {/* ── Outer page border frame — thick visible rails ── */}
      <div style={{ position: "fixed", top: 0, left: 14, bottom: 0, width: 2, background: C.border, zIndex: 60, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, right: 14, bottom: 0, width: 2, background: C.border, zIndex: 60, pointerEvents: "none" }} />

      {/* ── Back-to-top — black pill, topo.jpg style ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        style={{
          position: "fixed", right: 0, bottom: 140, zIndex: 70,
          opacity: showTop ? 1 : 0, pointerEvents: showTop ? "auto" : "none",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          transform: showTop ? "translateX(0)" : "translateX(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          padding: "18px 9px", background: "#1A1A1A", color: "#fff",
          border: "none", cursor: "pointer", borderRadius: "10px 0 0 10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 9V2M2 5.5L5.5 2L9 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase", writingMode: "vertical-rl" }}>Topo</span>
      </button>

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-10 md:px-14"
        style={{ background: "rgba(236,234,229,0.9)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(14px)" }}>
        <a href="#inicio" className="flex items-center gap-2 font-black text-[17px]" style={{ color: C.text }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: C.accent }}>
            <BarChart3 size={14} />
          </span>
          Precifica
        </a>
        <nav className="hidden md:flex items-center gap-9 text-sm font-medium" style={{ color: C.muted }}>
          {[["#como-funciona","Como funciona"],["#painel","Painel"],["#precos","Preços"],["#duvidas","Dúvidas"]].map(([h,l]) => (
            <a key={h} href={h} className="transition-colors hover:text-[#1A1A1A]">{l}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-[#1A1A1A]" style={{ color: C.muted }}>Entrar</Link>
          <Link href="/cadastro" className={btnBlack}>Comece grátis</Link>
        </div>
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: C.muted }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 z-40 px-8 py-5 space-y-4 text-sm font-medium border-b"
          style={{ top: 64, background: C.surface, borderColor: C.border }}>
          {[["#como-funciona","Como funciona"],["#painel","Painel"],["#precos","Preços"],["#duvidas","Dúvidas"]].map(([h,l]) => (
            <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block" style={{ color: C.muted }}>{l}</a>
          ))}
          <Link href="/login" className="block" style={{ color: C.muted }}>Entrar</Link>
          <Link href="/cadastro" className={btnBlack + " w-full"}>Comece grátis</Link>
        </div>
      )}

      <main>
        {/* ══ HERO ════════════════════════════════════════════════ */}
        <section id="inicio" className="relative overflow-hidden"
          style={{ background: C.bg, minHeight: "92vh", display: "flex", alignItems: "center" }}>

          {/* Radial ornament — larger, more visible */}
          <div style={{
            position: "absolute", top: "50%", right: -40, transform: "translateY(-50%)",
            width: 560, height: 560, borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(232,113,42,0.09) 0%, rgba(232,113,42,0.03) 45%, transparent 70%)",
          }} />
          {/* Second ornament — top left */}
          <div style={{
            position: "absolute", top: -80, left: -80, width: 320, height: 320,
            borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(212,208,203,0.35) 0%, transparent 65%)",
          }} />

          {/* Horizontal rule across hero */}
          <div style={{
            position: "absolute", left: 0, right: 0, top: "50%",
            height: 1, background: `linear-gradient(to right, transparent 5%, ${C.border} 30%, ${C.border} 70%, transparent 95%)`,
            opacity: 0.4, pointerEvents: "none",
          }} />

          <div className="relative w-full max-w-6xl mx-auto px-10 md:px-14 py-20 md:py-24 grid md:grid-cols-[1fr_1fr] gap-10 md:gap-14 items-center">

            {/* ── LEFT ── */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span style={{ width: 28, height: 1, background: C.muted }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted }}>
                  Para negócios de alimentação
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(2.5rem, 5.2vw, 3.9rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.025em", color: C.text, marginBottom: "1.4rem" }}>
                Saiba o preço<br/>
                certo. Venda<br/>
                com <It>lucro real.</It>
              </h1>

              <p style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)", lineHeight: 1.8, color: C.muted, maxWidth: 400, marginBottom: "2.25rem" }}>
                Descubra quanto custa produzir cada prato, monte fichas técnicas, controle os gastos e saiba se o negócio está dando lucro ou não.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-9">
                <Link href="/cadastro" className={btnBlack}>
                  Comece grátis <ArrowRight size={14} />
                </Link>
                <a href="#como-funciona" className={btnOutline}
                  style={{ color: C.text, border: `1.5px solid ${C.border}` }}>
                  Veja como funciona
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {["Grátis para começar","Sem cartão obrigatório","Cancele quando quiser"].map(l => (
                  <span key={l} className="flex items-center gap-1.5" style={{ fontSize: "0.75rem", fontWeight: 500, color: C.muted }}>
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.accent }}>
                      <Check size={8} className="text-white" />
                    </span>
                    {l}
                  </span>
                ))}
              </div>

              {/* Connector arrow going toward the right/image */}
              <div style={{ position: "relative", marginTop: "2.5rem", height: 1, maxWidth: 220 }}>
                <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                <svg style={{ position: "absolute", right: 0, top: -4, overflow: "visible" }} width="8" height="8" viewBox="0 0 8 8">
                  <path d="M0 4H6M3.5 1.5L6 4L3.5 6.5" stroke={C.border} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </div>

            {/* ── RIGHT — layered chef composition ── */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>

              {/* Orange circle accent */}
              <div style={{
                position: "absolute", top: 0, right: 10, width: 40, height: 40,
                borderRadius: "50%", background: C.accent, zIndex: 3, pointerEvents: "none",
              }} />

              {/* Thin vertical connector left of image */}
              <div style={{
                position: "absolute", left: -4, top: "15%", bottom: "15%", width: 1,
                background: `linear-gradient(to bottom, transparent, ${C.border} 30%, ${C.border} 70%, transparent)`,
                pointerEvents: "none", zIndex: 1,
              }} />

              {/* Thin horizontal connector above image */}
              <div style={{
                position: "absolute", top: "12%", left: "8%", right: "8%", height: 1,
                background: `linear-gradient(to right, transparent, ${C.border} 20%, ${C.border} 80%, transparent)`,
                pointerEvents: "none", zIndex: 1,
              }} />

              {/* Chef image — square crop */}
              <div style={{
                position: "relative", width: "100%", maxWidth: 460,
                borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
                border: `2px solid ${C.border}`, aspectRatio: "1/1", zIndex: 2,
              }}>
                <img src={chefImg} alt="Chef consultando custos e ficha técnica" draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                {/* Bottom fade */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "linear-gradient(to top, rgba(26,26,26,0.22) 0%, transparent 55%)",
                }} />
              </div>

              {/* ── Floating card: Margem real ── */}
              <div style={{
                position: "absolute", zIndex: 4, left: -20,
                top: "24%", transform: "translateY(-50%)",
                background: C.surface, border: `1.5px solid ${C.border}`,
                borderRadius: 16, padding: "14px 18px", minWidth: 148,
                boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: C.muted, marginBottom: 4 }}>Margem real</p>
                <p style={{ fontSize: "2.1rem", fontWeight: 900, lineHeight: 1, color: C.text }}>38%</p>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ height: 3, width: 44, borderRadius: 99, background: C.bg2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "38%", background: C.accent, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 9, color: C.muted }}>da receita</span>
                </div>
                {/* Arrow pointing right toward image */}
                <svg style={{ position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)", overflow: "visible" }} width="16" height="10" viewBox="0 0 16 10">
                  <path d="M0 5H13M9 1.5L13 5L9 8.5" stroke={C.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>

              {/* ── Floating card: Custo do prato ── */}
              <div style={{
                position: "absolute", zIndex: 4, right: -16,
                bottom: "20%", transform: "translateY(50%)",
                background: "#1A1A1A", borderRadius: 16, padding: "14px 18px",
                minWidth: 164, boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.38)", marginBottom: 4 }}>Custo do prato</p>
                <p style={{ fontSize: "1.65rem", fontWeight: 900, lineHeight: 1, color: "#fff" }}>R$ 34,90</p>
                <p style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: "#34D399" }}>
                  <TrendingUp size={10} /> Ficha técnica
                </p>
                {/* Arrow pointing left toward image */}
                <svg style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)", overflow: "visible" }} width="16" height="10" viewBox="0 0 16 10">
                  <path d="M16 5H3M7 1.5L3 5L7 8.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>

              {/* ── Floating badge: Ficha técnica ── */}
              <div style={{
                position: "absolute", zIndex: 4, left: "12%", bottom: -14,
                background: C.bg2, border: `1.5px solid ${C.border}`,
                borderRadius: 99, padding: "7px 16px",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.text }}>Ficha técnica criada</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.accent }}>✓</span>
              </div>

              {/* Dashed connector line from margin card area downward */}
              <svg style={{ position: "absolute", left: 16, top: "28%", overflow: "visible", pointerEvents: "none", zIndex: 5 }} width="2" height="60">
                <line x1="1" y1="0" x2="1" y2="60" stroke={C.border} strokeWidth="1" strokeDasharray="4 4"/>
                <polygon points="-2,56 1,60 4,56" fill={C.border} />
              </svg>
            </div>
          </div>
        </section>

        {/* ══ PROBLEMA / VALOR ════════════════════════════════════ */}
        <section style={{ background: C.bg2 }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.accent, marginBottom: "1.25rem" }}>O problema real</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: C.text, marginBottom: "1.5rem" }}>
                Muita gente vende<br/>todos os dias sem saber<br/>
                se está <It>ganhando ou perdendo.</It>
              </h2>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: C.muted, marginBottom: "1.1rem" }}>
                Quando o custo dos insumos, as despesas do mês e o preço de venda ficam espalhados, a operação segue no improviso. O caixa entra, mas o lucro real continua escondido.
              </p>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: C.muted }}>
                O Precifica reúne tudo em um só lugar: fichas técnicas, custos, despesas fixas e precificação. Você vê o que entra, o que sai e se está valendo a pena.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Custo real por prato",    value: "R$ 34,90",  sub: "Via ficha técnica",     dark: false },
                  { label: "Margem de contribuição",  value: "38%",       sub: "Acima da meta",         dark: true  },
                  { label: "Despesas fixas no mês",   value: "R$ 5.029",  sub: "Registradas no painel", dark: false },
                  { label: "Ponto de equilíbrio",     value: "R$ 25,2k",  sub: "Meta mensal",           dark: false },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl p-5 transition-all hover:shadow-md"
                    style={{ background: c.dark ? "#1A1A1A" : C.surface, border: `1px solid ${c.dark ? "transparent" : C.border}` }}>
                    <p style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: c.dark ? "rgba(255,255,255,0.4)" : C.muted, marginBottom: 8 }}>{c.label}</p>
                    <p style={{ fontSize: "1.75rem", fontWeight: 900, lineHeight: 1, color: c.dark ? "#fff" : C.text }}>{c.value}</p>
                    <p style={{ fontSize: "0.7rem", marginTop: 6, color: c.dark ? "rgba(255,255,255,0.3)" : C.muted }}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ COMO FUNCIONA ═══════════════════════════════════════ */}
        <section id="como-funciona" style={{ background: C.bg }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: "1rem" }}>Como funciona</p>
              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-14">
                <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: C.text, maxWidth: 480 }}>
                  Tudo o que você precisa em um fluxo simples
                </h2>
                <div className="flex items-center gap-2.5 mb-1 md:mb-0 md:ml-8 shrink-0 px-4 py-2 rounded-full"
                  style={{ background: C.bg2, border: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                  <FileSpreadsheet size={13} style={{ color: C.accent }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted }}>Importação facilitada via Excel</span>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4 mb-16">
              {[
                { n: "01", icon: <LayoutDashboard size={17} />, title: "Cadastre produtos e insumos",   text: "Registre o que você vende e os ingredientes usados. Pare de depender de anotações espalhadas e cálculos manuais. Você pode importar dados diretamente de uma planilha Excel para agilizar o preenchimento." },
                { n: "02", icon: <BookOpen size={17} />,        title: "Monte fichas técnicas",         text: "Defina ingredientes, gramatura, rendimento e custo de preparo para saber exatamente quanto cada prato custa para produzir." },
                { n: "03", icon: <Wallet size={17} />,          title: "Registre gastos e lançamentos", text: "Acompanhe saídas, entradas e custos fixos do mês com mais organização e sem improvisação." },
                { n: "04", icon: <TrendingUp size={17} />,      title: "Veja margem e resultado",       text: "Acompanhe os números mais importantes do negócio e ajuste preço, reduza desperdício ou aumente lucro com mais base." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 60}>
                  <div className="rounded-2xl p-7 h-full transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start gap-5">
                      <span style={{ fontSize: "2.1rem", fontWeight: 900, lineHeight: 1, flexShrink: 0, marginTop: 2, color: C.border, userSelect: "none" }}>{s.n}</span>
                      <div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: C.bg2, color: C.accent }}>{s.icon}</div>
                        <h3 style={{ fontSize: "0.97rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: C.muted }}>{s.text}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Dashboard mockup */}
            <Reveal delay={80}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: "0.75rem" }}>O painel na prática</p>
              <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `1.5px solid ${C.border}` }}>
                <div className="flex items-center gap-1.5 px-4 h-9" style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="mx-auto text-[11px] font-medium px-12 rounded h-5 flex items-center" style={{ background: C.surface, color: C.muted }}>precifica.app/painel</span>
                </div>
                <img src={dashboardImg} alt="Painel do Precifica — receita, custos, margem e ponto de equilíbrio" className="w-full block" draggable={false} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ PAINEL DARK ═════════════════════════════════════════ */}
        <section id="painel" style={{ background: "#1A1A1A" }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.accent, marginBottom: "1rem" }}>O painel</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: "#fff", marginBottom: "1.25rem" }}>
                Todos os números<br/>do negócio em<br/><It dark>um só lugar</It>
              </h2>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
                Receita, custos, margem média, ponto de equilíbrio, despesas fixas, lançamentos recentes e desempenho dos produtos — tudo reunido e atualizado automaticamente.
              </p>
              <div className="space-y-3">
                {["Receita e custo por período","Margem média do portfólio","Ponto de equilíbrio mensal","Ranking de produtos por lucro","Alertas de margem abaixo do ideal"].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white">
                    <Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="grid grid-cols-2 gap-3">
                {[["Receita","Entradas por período"],["Margem Média","Saúde do portfólio"],["Ponto de equilíbrio","Meta de faturamento"],["Top Produtos","Ranking de desempenho"]].map(([t,s]) => (
                  <div key={t} className="rounded-2xl p-5 transition-all hover:bg-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{t}</p>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{s}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ TIPOS DE NEGÓCIO ════════════════════════════════════ */}
        <section style={{ background: C.bg }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: "1rem" }}>Para o seu negócio</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: C.text, marginBottom: "3.5rem", maxWidth: 500 }}>
                Feito para quem trabalha com alimentação
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <UtensilsCrossed size={17} />, title: "Restaurantes",  text: "Entenda o custo dos pratos, controle os gastos e ajuste preços sem perder competitividade." },
                { icon: <ShoppingBag size={17} />,     title: "Marmitarias",   text: "Organize produção, fichas técnicas e rendimento para precificar com mais consistência." },
                { icon: <Coffee size={17} />,          title: "Confeitarias",  text: "Controle ingredientes, gramatura e custos de produção para não vender abaixo do necessário." },
                { icon: <Sandwich size={17} />,        title: "Lanchonetes",   text: "Acompanhe custos de insumos e combos com mais precisão para vender melhor e parar de perder no detalhe." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <div className="rounded-2xl p-7 flex gap-5 items-start transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.bg2, color: C.accent }}>{b.icon}</div>
                    <div>
                      <h3 style={{ fontSize: "0.97rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{b.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: C.muted }}>{b.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BENEFÍCIOS ══════════════════════════════════════════ */}
        <section style={{ background: C.bg2 }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: C.text, marginBottom: "3.5rem", maxWidth: 420 }}>
                Mais organização para <It>decidir melhor</It>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-10 max-w-3xl">
              {[
                { title: "Menos planilhas confusas",        text: "Centralize informações em uma plataforma mais simples e fácil de acompanhar." },
                { title: "Preço formado com base real",     text: "Saiba quanto custa produzir e forme o preço com mais segurança, sem chute e sem prejuízo escondido." },
                { title: "Margem visível por produto",      text: "Veja qual produto está gerando mais lucro e qual está pesando no custo — com dados, não com suposição." },
                { title: "Menos desperdício de tempo",      text: "Ganhe tempo na rotina com uma base de dados organizada e pare de refazer cálculos toda semana." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 70}>
                  <div className="flex gap-4 items-start">
                    <span style={{ width: 3, height: 28, borderRadius: 99, background: C.accent, display: "block", flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <h3 style={{ fontSize: "0.97rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{b.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: C.muted }}>{b.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PLANOS ══════════════════════════════════════════════ */}
        <section id="precos" style={{ background: C.bg }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: "1rem" }}>Planos</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, lineHeight: 1.08, color: C.text, marginBottom: "0.75rem", maxWidth: 520 }}>
                Comece grátis. Evolua no seu ritmo.
              </h2>
              <p style={{ fontSize: "0.975rem", color: C.muted, maxWidth: 440, marginBottom: "2.5rem" }}>
                Teste a plataforma sem compromisso e avance para um plano pago quando precisar de mais controle.
              </p>
              <div className="inline-flex items-center p-1 rounded-full mb-10" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                <button onClick={() => setAnual(false)} className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={!anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>Mensal</button>
                <button onClick={() => setAnual(true)} className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>
                  Anual <span className="ml-1 text-xs opacity-70">— 2 meses grátis</span>
                </button>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5 items-start">
              <Reveal>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Grátis</h3>
                  <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para começar e entender se o produto faz sentido para você.</p>
                  <div style={{ marginBottom: "1.5rem" }}><span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ 0</span><span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>/mês</span></div>
                  <Link href="/cadastro"><button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:bg-[#1A1A1A] hover:text-white border mb-7" style={{ borderColor: C.border, color: C.text }}>Comece grátis</button></Link>
                  <div className="space-y-3">{["Até 5 produtos","Até 10 fichas técnicas","Até 30 insumos","Cálculo de custo e CMV"].map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}><Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}</div>
                  ))}</div>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="rounded-2xl p-7 relative md:-mt-5 shadow-xl" style={{ background: "#1A1A1A", border: `2px solid ${C.accent}` }}>
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: "0.68rem", fontWeight: 700, padding: "3px 14px", borderRadius: 99, background: C.accent, color: "#fff", whiteSpace: "nowrap" }}>Mais popular</div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Pro</h3>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem" }}>Para quem precisa de mais controle na operação e na precificação.</p>
                  <div style={{ marginBottom: "1.5rem" }}><span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff" }}>R$ {fmt(anual ? PRICES.pro.a : PRICES.pro.m)}</span><span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>{anual ? "/ano" : "/mês"}</span></div>
                  <Link href="/planos"><button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.97] mb-7 text-white" style={{ background: C.accent }}>Assinar Pro</button></Link>
                  <div className="space-y-3">{["Produtos ilimitados","Fichas técnicas ilimitadas","Insumos ilimitados","Cálculo de margem real","Dashboard de custos","Alertas de margem baixa"].map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-white"><Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}</div>
                  ))}</div>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Premium</h3>
                  <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para uma gestão mais completa, com visão mais estratégica do negócio.</p>
                  <div style={{ marginBottom: "1.5rem" }}><span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ {fmt(anual ? PRICES.premium.a : PRICES.premium.m)}</span><span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>{anual ? "/ano" : "/mês"}</span></div>
                  <Link href="/planos"><button className={btnBlack + " w-full mb-7"}>Assinar Premium</button></Link>
                  <div className="space-y-3">{["Tudo do plano Pro","Gestão de despesas fixas","Fluxo de caixa","Ponto de equilíbrio","Relatórios avançados","Controle de funcionários"].map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}><Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}</div>
                  ))}</div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════════ */}
        <section id="duvidas" style={{ background: C.bg2 }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-2xl">
            <Reveal>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: C.muted, marginBottom: "1rem" }}>Dúvidas</p>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: C.text, marginBottom: "2.5rem" }}>
                Dúvidas frequentes
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <Accordion type="single" collapsible className="space-y-2">
                {FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`f${i}`} className="rounded-xl px-5 overflow-hidden"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline" style={{ color: C.text }}>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm pb-4 leading-relaxed" style={{ color: C.muted }}>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════════════ */}
        <section style={{ background: "#1A1A1A" }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-2xl mx-auto text-center">
            <Reveal>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-8" style={{ background: C.accent }}>
                <BarChart3 size={20} className="text-white" />
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#fff", marginBottom: "1.25rem", lineHeight: 1.08 }}>
                Comece a saber se o seu negócio<br/>está dando <It dark>lucro de verdade</It>
              </h2>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", marginBottom: "2.25rem" }}>
                Organize custos, controle gastos e forme preço com base real — não com chute. Grátis para começar.
              </p>
              <Link href="/cadastro">
                <button style={{ height: 48, padding: "0 36px", borderRadius: 999, background: "#fff", color: "#1A1A1A", fontWeight: 700, fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none", transition: "opacity 0.2s" }}>
                  Comece grátis <ArrowRight size={15} />
                </button>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-10 px-10 md:px-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2 font-black text-base text-white">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.accent }}><BarChart3 size={12} className="text-white" /></span>
            Precifica
          </div>
          <div className="flex items-center gap-7 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#duvidas" className="hover:text-white transition-colors">Dúvidas</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Precifica. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
