import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Check, TrendingUp, BookOpen, Wallet, LayoutDashboard, UtensilsCrossed, Coffee, ShoppingBag, Sandwich, ArrowRight, ArrowUp } from "lucide-react";
import dashboardImg from "@assets/Captura_de_tela_27-5-2026_182552_d4272d6d-2b36-4ab1-adf1-6048_1779919697917.jpeg";
import chefImg from "@assets/chef_hero.png";

/* ── palette ── */
const C = {
  bg:      "#ECEAE5",
  bg2:     "#E6E2DB",
  surface: "#F5F4F1",
  text:    "#1A1A1A",
  muted:   "#6B6864",
  border:  "#D4D0CB",
  accent:  "#E8712A",
};

/* ── smooth scroll + reduced-motion guard ── */
function useSmoothScroll() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) document.documentElement.style.scrollBehavior = "smooth";
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
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setV(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, v };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, v } = useFadeUp();
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={className} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ── back-to-top visibility ── */
function useScrolled(threshold = 400) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return visible;
}

/* ── pricing data ── */
const PRICES = { pro: { m: 19.90, a: 199.00 }, premium: { m: 39.90, a: 399.00 } };
function fmt(v: number) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

/* ── FAQ ── */
const FAQ = [
  { q: "Preciso entender de finanças para usar?", a: "Não. O Precifica foi pensado para quem trabalha com alimentação no dia a dia, não para especialistas em finanças. Os números aparecem de forma simples e direta." },
  { q: "Serve para pequeno negócio?", a: "Sim. A plataforma foi pensada para a realidade de marmitarias, confeitarias, restaurantes e lanchonetes que precisam organizar custos e fichas técnicas de forma prática." },
  { q: "Posso testar grátis?", a: "Sim. Você pode começar no plano grátis e conhecer tudo antes de decidir avançar para um plano pago." },
  { q: "Funciona no celular?", a: "Sim. A plataforma funciona bem em diferentes dispositivos, facilitando o acesso mesmo na correria do dia a dia." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Você gerencia sua assinatura de forma simples, sem burocracia." },
];

/* ── button styles ── */
const btnBlack = "inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold transition-all hover:bg-[#2d2d2d] active:scale-[0.97]";
const btnOutline = "inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full text-sm font-semibold transition-all active:scale-[0.97]";

/* italic helper */
const It = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
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

      {/* ── Outer page border frame (left + right rails) ── */}
      <div style={{ position: "fixed", top: 0, left: 20, bottom: 0, width: 1, background: C.border, zIndex: 60, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, right: 20, bottom: 0, width: 1, background: C.border, zIndex: 60, pointerEvents: "none" }} />

      {/* ── Back-to-top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
        style={{
          position: "fixed", right: 0, bottom: 120, zIndex: 70,
          opacity: showTop ? 1 : 0, pointerEvents: showTop ? "auto" : "none",
          transition: "opacity 0.3s ease",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          padding: "12px 6px", background: "transparent",
          color: C.muted, border: "none", cursor: "pointer",
          writingMode: "vertical-rl",
        }}
      >
        <ArrowUp size={13} style={{ rotate: "0deg", writingMode: "horizontal-tb", flexShrink: 0 }} />
        <span style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase" }}>Topo</span>
      </button>

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-10 md:px-14"
        style={{ background: "rgba(236,234,229,0.88)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(14px)" }}>
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
          <Link href="/cadastro" className={btnBlack}>Começar grátis</Link>
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
          <Link href="/cadastro" className={btnBlack + " w-full"}>Começar grátis</Link>
        </div>
      )}

      <main>
        {/* ══ HERO ════════════════════════════════════════════════ */}
        <section id="inicio" className="relative overflow-hidden"
          style={{ background: C.bg, minHeight: "92vh", display: "flex", alignItems: "center" }}>

          {/* Subtle radial ornament */}
          <div style={{
            position: "absolute", top: "50%", right: -60, transform: "translateY(-50%)",
            width: 480, height: 480, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,113,42,0.06) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />

          <div className="relative w-full max-w-6xl mx-auto px-10 md:px-14 py-20 md:py-28 grid md:grid-cols-[1fr_1fr] gap-12 md:gap-16 items-center">

            {/* LEFT */}
            <div>
              {/* Label tag */}
              <div className="flex items-center gap-3 mb-9">
                <span style={{ width: 28, height: 1, background: C.muted }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                  Para negócios de alimentação
                </span>
              </div>

              {/* Headline */}
              <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.75rem)", fontWeight: 900, lineHeight: 1.03, letterSpacing: "-0.02em", color: C.text, marginBottom: "1.5rem" }}>
                Saiba o preço<br/>
                certo. Venda<br/>
                com <It>lucro real.</It>
              </h1>

              <p className="leading-[1.8] mb-10 max-w-[400px]"
                style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)", color: C.muted }}>
                O Precifica ajuda você a descobrir quanto custa produzir cada prato, montar fichas técnicas, controlar os gastos e saber se o negócio está dando lucro ou não.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/cadastro" className={btnBlack} style={{ fontSize: "0.9rem" }}>
                  Começar grátis <ArrowRight size={14} />
                </Link>
                <a href="#como-funciona" className={btnOutline} style={{ color: C.text, border: `1px solid ${C.border}`, fontSize: "0.9rem" }}>
                  Ver como funciona
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {["Grátis para começar", "Sem cartão obrigatório", "Cancele quando quiser"].map(l => (
                  <span key={l} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.muted }}>
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.accent }}>
                      <Check size={8} className="text-white" />
                    </span>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — chef image composition */}
            <div className="relative flex items-center justify-center md:justify-end">

              {/* Orange circle accent */}
              <div style={{
                position: "absolute", top: -8, right: 16, width: 36, height: 36,
                borderRadius: "50%", background: C.accent, zIndex: 3, pointerEvents: "none",
              }} />

              {/* Thin connector line from card to image */}
              <div style={{
                position: "absolute", left: -8, top: "50%", width: 1, height: 80,
                background: `linear-gradient(to bottom, transparent, ${C.border}, transparent)`,
                transform: "translateY(-50%)", pointerEvents: "none",
              }} />

              {/* Chef image */}
              <div className="relative w-full max-w-[480px] rounded-3xl overflow-hidden shadow-xl z-[2]"
                style={{ border: `1.5px solid ${C.border}`, aspectRatio: "3/4" }}>
                <img src={chefImg} alt="Chef consultando ficha técnica no Precifica" className="w-full h-full object-cover block" draggable={false} />
                {/* Subtle image overlay gradient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(26,26,26,0.18) 0%, transparent 50%)",
                  pointerEvents: "none",
                }} />
              </div>

              {/* Floating card — margem */}
              <div className="absolute z-[4] rounded-2xl px-4 py-3 shadow-xl"
                style={{ background: C.surface, border: `1px solid ${C.border}`, minWidth: 140, left: -14, top: "22%", transform: "translateY(-50%)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, marginBottom: 3 }}>Margem real</p>
                <p style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1, color: C.text }}>38%</p>
                {/* Arrow connector detail */}
                <div className="mt-2 flex items-center gap-1.5">
                  <div style={{ height: 3, width: 40, borderRadius: 99, background: C.bg2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "38%", background: C.accent, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10, color: C.muted }}>da receita</span>
                </div>
              </div>

              {/* Floating card — custo */}
              <div className="absolute z-[4] rounded-2xl px-4 py-3 shadow-xl"
                style={{ background: "#1A1A1A", minWidth: 158, right: -12, bottom: "18%", transform: "translateY(50%)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.38)", marginBottom: 3 }}>Custo do prato</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1, color: "#ffffff" }}>R$ 14,50</p>
                <p className="flex items-center gap-1 mt-1.5" style={{ fontSize: 11, color: "#34D399" }}>
                  <TrendingUp size={11} /> Ficha técnica
                </p>
              </div>

              {/* Thin arrow line from margin card to image edge */}
              <svg style={{ position: "absolute", left: 0, top: "28%", width: 30, height: 2, zIndex: 5, overflow: "visible", pointerEvents: "none" }}>
                <line x1="0" y1="1" x2="28" y2="1" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />
                <polygon points="26,-2 30,1 26,4" fill={C.border} />
              </svg>
            </div>
          </div>
        </section>

        {/* ══ PROBLEMA / VALOR ════════════════════════════════════ */}
        <section style={{ background: C.bg2 }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.accent, marginBottom: "1.25rem" }}>
                O problema real
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: C.text, marginBottom: "1.5rem" }}>
                Muita gente vende todos os dias sem saber se está<br/>
                <It>ganhando ou perdendo.</It>
              </h2>
              <p className="leading-[1.8] mb-5" style={{ fontSize: "0.975rem", color: C.muted }}>
                Quando o custo dos insumos, as despesas do mês e o preço de venda ficam espalhados, a operação segue no improviso. O caixa entra, mas o lucro real continua escondido.
              </p>
              <p className="leading-[1.8]" style={{ fontSize: "0.975rem", color: C.muted }}>
                O Precifica reúne tudo em um só lugar: fichas técnicas, custos, despesas fixas e precificação. Você vê o que entra, o que sai e se está valendo a pena.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Custo real por prato",       value: "R$ 14,50",  sub: "Via ficha técnica",    dark: false },
                  { label: "Margem de contribuição",     value: "38%",       sub: "Acima da meta",        dark: true  },
                  { label: "Despesas fixas no mês",      value: "R$ 5.029",  sub: "Registradas no painel", dark: false },
                  { label: "Ponto de equilíbrio",        value: "R$ 80,2k",  sub: "Meta mensal",          dark: false },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl p-5 transition-all hover:shadow-md"
                    style={{ background: c.dark ? "#1A1A1A" : C.surface, border: `1px solid ${c.dark ? "transparent" : C.border}` }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: c.dark ? "rgba(255,255,255,0.4)" : C.muted, marginBottom: 8 }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize: "1.7rem", fontWeight: 900, lineHeight: 1, color: c.dark ? "#fff" : C.text }}>{c.value}</p>
                    <p style={{ fontSize: "0.7rem", marginTop: 6, color: c.dark ? "rgba(255,255,255,0.3)" : C.muted }}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ COMO FUNCIONA + DASHBOARD SHOWCASE ══════════════════ */}
        <section id="como-funciona" style={{ background: C.bg }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.muted, marginBottom: "1rem" }}>
                Como funciona
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: C.text, marginBottom: "3.5rem", maxWidth: 520 }}>
                Tudo o que você precisa em um fluxo simples
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4 mb-16">
              {[
                { n: "01", icon: <LayoutDashboard size={17} />, title: "Cadastre produtos e insumos",      text: "Registre o que você vende e os ingredientes usados. Pare de depender de anotações espalhadas e cálculos manuais." },
                { n: "02", icon: <BookOpen size={17} />,        title: "Monte fichas técnicas",            text: "Defina ingredientes, gramatura, rendimento e custo de preparo para saber exatamente quanto cada prato custa para produzir." },
                { n: "03", icon: <Wallet size={17} />,          title: "Registre gastos e lançamentos",    text: "Acompanhe saídas, entradas e custos fixos do mês com mais organização e sem improvisação." },
                { n: "04", icon: <TrendingUp size={17} />,      title: "Veja margem e resultado",          text: "Acompanhe os números mais importantes do negócio e ajuste preço, reduza desperdício ou aumente lucro com mais base." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 60}>
                  <div className="group rounded-2xl p-7 h-full transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start gap-5">
                      <span style={{ fontSize: "2.1rem", fontWeight: 900, lineHeight: 1, flexShrink: 0, marginTop: 2, color: C.border, userSelect: "none" }}>
                        {s.n}
                      </span>
                      <div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                          style={{ background: C.bg2, color: C.accent }}>
                          {s.icon}
                        </div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: C.muted }}>{s.text}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Dashboard mockup — lives here, not in hero */}
            <Reveal delay={80}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.muted, marginBottom: "0.75rem" }}>
                O painel na prática
              </p>
              <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `1.5px solid ${C.border}` }}>
                <div className="flex items-center gap-1.5 px-4 h-9" style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="mx-auto text-[11px] font-medium px-12 rounded h-5 flex items-center"
                    style={{ background: C.surface, color: C.muted }}>
                    precifica.app/painel
                  </span>
                </div>
                <img src={dashboardImg} alt="Painel do Precifica — receita, custos, margem e ponto de equilíbrio" className="w-full block" draggable={false} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ SHOWCASE PAINEL — dark section ══════════════════════ */}
        <section id="painel" style={{ background: "#1A1A1A" }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.accent, marginBottom: "1rem" }}>
                O painel
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: "#fff", marginBottom: "1.25rem" }}>
                Todos os números<br/>do negócio em<br/><It>um só lugar</It>
              </h2>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
                Receita, custos, margem média, ponto de equilíbrio, despesas fixas, lançamentos recentes e desempenho dos produtos — tudo reunido e atualizado automaticamente conforme você registra.
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
                {[
                  ["Receita",       "Entradas por período"],
                  ["Margem Média",  "Saúde do portfólio"],
                  ["P. Equilíbrio", "Meta de faturamento"],
                  ["Top Produtos",  "Ranking de desempenho"],
                ].map(([t, s]) => (
                  <div key={t} className="rounded-2xl p-5 transition-all hover:bg-white/[0.06]"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.muted, marginBottom: "1rem" }}>
                Para o seu negócio
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: C.text, marginBottom: "3.5rem", maxWidth: 500 }}>
                Feito para a rotina de quem trabalha com alimentação
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <UtensilsCrossed size={17} />, title: "Restaurantes",  text: "Entenda o custo dos pratos, controle os gastos e ajuste preços sem perder competitividade." },
                { icon: <ShoppingBag size={17} />,     title: "Marmitarias",   text: "Organize produção, fichas técnicas e rendimento para precificar com mais consistência." },
                { icon: <Coffee size={17} />,          title: "Confeitarias",  text: "Controle ingredientes, porções e custos de produção para não vender abaixo do necessário." },
                { icon: <Sandwich size={17} />,        title: "Lanchonetes",   text: "Acompanhe custos de insumos e combos com mais precisão para vender melhor e parar de perder no detalhe." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <div className="group rounded-2xl p-7 flex gap-5 items-start transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: C.bg2, color: C.accent }}>
                      {b.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{b.title}</h3>
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
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: C.text, marginBottom: "3.5rem", maxWidth: 420 }}>
                Mais organização para <It>decidir melhor</It>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-10 max-w-3xl">
              {[
                { title: "Menos planilhas confusas",       text: "Centralize informações importantes em uma plataforma mais simples e fácil de acompanhar." },
                { title: "Preço formado com base real",    text: "Saiba quanto custa produzir e forme o preço com mais segurança, sem chute e sem prejuízo escondido." },
                { title: "Margem visível por produto",     text: "Veja qual produto está gerando mais lucro e qual está pesando no custo — com dados, não com suposição." },
                { title: "Menos desperdício de tempo",     text: "Ganhe tempo na rotina com uma base de dados organizada e pare de refazer cálculos toda semana." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 70}>
                  <div className="flex gap-4 items-start">
                    <span className="shrink-0 mt-1" style={{ width: 3, height: 28, borderRadius: 99, background: C.accent, display: "block" }} />
                    <div>
                      <h3 style={{ fontSize: "0.975rem", fontWeight: 700, color: C.text, marginBottom: 6 }}>{b.title}</h3>
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
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: C.muted, marginBottom: "1rem" }}>
                Planos
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, lineHeight: 1.1, color: C.text, marginBottom: "0.75rem", maxWidth: 520 }}>
                Comece grátis. Evolua no seu ritmo.
              </h2>
              <p style={{ fontSize: "0.975rem", color: C.muted, maxWidth: 440, marginBottom: "2.5rem" }}>
                Teste a plataforma sem compromisso e avance para um plano pago quando precisar de mais controle.
              </p>

              {/* Toggle */}
              <div className="inline-flex items-center p-1 rounded-full mb-10" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                <button onClick={() => setAnual(false)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={!anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>
                  Mensal
                </button>
                <button onClick={() => setAnual(true)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                  style={anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>
                  Anual <span className="ml-1 text-xs opacity-70">— 2 meses grátis</span>
                </button>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {/* Grátis */}
              <Reveal>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Grátis</h3>
                  <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para começar e entender se o produto faz sentido para você.</p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ 0</span>
                    <span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>/mês</span>
                  </div>
                  <Link href="/cadastro">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:bg-[#1A1A1A] hover:text-white border mb-7"
                      style={{ borderColor: C.border, color: C.text }}>
                      Começar grátis
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Até 5 produtos","Até 10 fichas técnicas","Até 30 insumos","Cálculo de custo e CMV"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}>
                        <Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Pro */}
              <Reveal delay={80}>
                <div className="rounded-2xl p-7 relative md:-mt-5 shadow-xl" style={{ background: "#1A1A1A", border: `2px solid ${C.accent}` }}>
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    fontSize: "0.7rem", fontWeight: 700, padding: "3px 14px", borderRadius: 99,
                    background: C.accent, color: "#fff", whiteSpace: "nowrap",
                  }}>
                    Mais popular
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Pro</h3>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem" }}>Para quem precisa de mais controle na operação e na precificação.</p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff" }}>R$ {fmt(anual ? PRICES.pro.a : PRICES.pro.m)}</span>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.97] mb-7 text-white"
                      style={{ background: C.accent }}>
                      Assinar Pro
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Produtos ilimitados","Fichas técnicas ilimitadas","Insumos ilimitados","Cálculo de margem real","Dashboard de custos","Alertas de margem baixa"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-white">
                        <Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Premium */}
              <Reveal delay={160}>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Premium</h3>
                  <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para uma gestão mais completa, com visão mais estratégica do negócio.</p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ {fmt(anual ? PRICES.premium.a : PRICES.premium.m)}</span>
                    <span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos">
                    <button className={btnBlack + " w-full mb-7"}>Assinar Premium</button>
                  </Link>
                  <div className="space-y-3">
                    {["Tudo do plano Pro","Gestão de despesas fixas","Fluxo de caixa","Ponto de equilíbrio","Relatórios avançados","Controle de funcionários"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}>
                        <Check size={13} style={{ color: C.accent, flexShrink: 0 }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════════ */}
        <section id="duvidas" style={{ background: C.bg2 }} className="py-24 md:py-32 px-10 md:px-14">
          <div className="max-w-2xl mx-auto">
            <Reveal>
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, color: C.text, marginBottom: "2.5rem" }}>
                Dúvidas frequentes
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <Accordion type="single" collapsible className="space-y-2">
                {FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`f${i}`} className="rounded-xl px-5 overflow-hidden"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline" style={{ color: C.text }}>
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm pb-4 leading-relaxed" style={{ color: C.muted }}>
                      {item.a}
                    </AccordionContent>
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
              <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "#fff", marginBottom: "1.25rem", lineHeight: 1.1 }}>
                Comece a saber se o seu negócio<br/>está dando <It>lucro de verdade</It>
              </h2>
              <p style={{ fontSize: "0.975rem", lineHeight: 1.8, color: "rgba(255,255,255,0.5)", marginBottom: "2.25rem" }}>
                Organize custos, controle gastos e forme preço com base real — não com chute. Grátis para começar, sem cartão obrigatório.
              </p>
              <Link href="/cadastro">
                <button style={{
                  height: 48, padding: "0 36px", borderRadius: 999,
                  background: "#fff", color: "#1A1A1A", fontWeight: 700, fontSize: "0.9rem",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  transition: "opacity 0.2s", cursor: "pointer", border: "none",
                }}>
                  Começar grátis <ArrowRight size={15} />
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
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.accent }}>
              <BarChart3 size={12} className="text-white" />
            </span>
            Precifica
          </div>
          <div className="flex items-center gap-7 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#duvidas" className="hover:text-white transition-colors">Dúvidas</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Precifica. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
