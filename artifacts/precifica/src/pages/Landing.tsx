import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Check, ChevronRight, TrendingUp, BookOpen, Wallet, LayoutDashboard, UtensilsCrossed, Coffee, ShoppingBag, Sandwich, ArrowRight } from "lucide-react";
import dashboardImg from "@assets/Captura_de_tela_27-5-2026_182552_d4272d6d-2b36-4ab1-adf1-6048_1779919697917.jpeg";

/* ── palette ── */
const C = {
  bg:        "#ECEAE5",
  bg2:       "#E6E2DB",
  surface:   "#F5F4F1",
  text:      "#1A1A1A",
  muted:     "#6B6864",
  border:    "#D4D0CB",
  accent:    "#E8712A",
};

/* ── scroll reveal ── */
function useFadeUp(threshold = 0.1) {
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
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(22px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ── pricing data ── */
const PRICES = { pro: { m: 19.90, a: 199.00 }, premium: { m: 39.90, a: 399.00 } };
function fmt(v: number) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/* ── FAQ ── */
const FAQ = [
  { q: "Preciso entender de finanças para usar?", a: "Não. A proposta do Precifica é justamente tornar os números mais fáceis de visualizar e acompanhar, mesmo para quem não tem formação financeira." },
  { q: "Serve para pequeno negócio?", a: "Sim. O Precifica foi pensado para a realidade de negócios de alimentação que precisam organizar custos, fichas técnicas, despesas e margem de forma mais prática." },
  { q: "Posso testar grátis?", a: "Sim. Você pode começar no plano grátis e conhecer a plataforma antes de decidir avançar para um plano pago." },
  { q: "Funciona no celular?", a: "Sim. A plataforma foi pensada para funcionar bem em diferentes dispositivos, facilitando o acesso no dia a dia." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Você pode gerenciar sua assinatura de forma simples, sem burocracia desnecessária." },
];

/* ── shared button styles ── */
const btnBlack = "inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold transition-all hover:bg-[#2d2d2d] active:scale-[0.97]";
const btnGhost = "inline-flex items-center gap-2 h-11 px-6 rounded-full text-sm font-semibold transition-all hover:bg-[#D4D0CB]/40 active:scale-[0.97]";

/* ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  const [anual, setAnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Satoshi', sans-serif" }}>

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-12"
        style={{ background: "rgba(236,234,229,0.85)", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(12px)" }}>
        <a href="#inicio" className="flex items-center gap-2 font-black text-[17px]" style={{ color: C.text }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: C.accent }}>
            <BarChart3 size={14} />
          </span>
          Precifica
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: C.muted }}>
          <a href="#como-funciona" className="hover:text-[#1A1A1A] transition-colors">Como funciona</a>
          <a href="#painel" className="hover:text-[#1A1A1A] transition-colors">Painel</a>
          <a href="#precos" className="hover:text-[#1A1A1A] transition-colors">Preços</a>
          <a href="#duvidas" className="hover:text-[#1A1A1A] transition-colors">Dúvidas</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-[#1A1A1A]" style={{ color: C.muted }}>Entrar</Link>
          <Link href="/cadastro" className={btnBlack}>Começar grátis</Link>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: C.muted }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 z-40 px-6 py-5 space-y-4 text-sm font-medium border-b"
          style={{ top: 64, background: C.surface, borderColor: C.border }}>
          {["#como-funciona|Como funciona","#painel|Painel","#precos|Preços","#duvidas|Dúvidas"].map(s => {
            const [href, label] = s.split("|");
            return <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block" style={{ color: C.muted }}>{label}</a>;
          })}
          <Link href="/login" className="block" style={{ color: C.muted }}>Entrar</Link>
          <Link href="/cadastro" className={btnBlack + " w-full justify-center"}>Começar grátis</Link>
        </div>
      )}

      <main>
        {/* ══ HERO ════════════════════════════════════════════════ */}
        <section id="inicio" className="relative overflow-hidden min-h-[90vh] flex items-center"
          style={{ background: C.bg }}>

          {/* Subtle radial geometric bg detail */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full pointer-events-none opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #1A1A1A 0%, transparent 70%)" }} />

          <div className="relative w-full max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 grid md:grid-cols-[1fr_1.1fr] gap-16 items-center">

            {/* LEFT */}
            <div>
              {/* Tag */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-8"
                style={{ color: C.muted }}>
                <span className="w-5 h-[1px]" style={{ background: C.muted }} />
                Teste grátis — entenda a margem do seu negócio
              </div>

              {/* Headline */}
              <h1 className="text-[2.85rem] md:text-[3.75rem] font-black leading-[1.05] tracking-tight mb-6"
                style={{ color: C.text }}>
                Precifique com{" "}
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400, color: C.accent }}>
                  clareza.
                </span>
                <br />
                Venda com mais{" "}
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
                  lucro.
                </span>
              </h1>

              <p className="text-base leading-[1.75] mb-9 max-w-[420px]" style={{ color: C.muted }}>
                O Precifica ajuda negócios de alimentação a organizar custos, montar fichas técnicas, acompanhar despesas e entender a margem real de cada produto com muito mais simplicidade.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/cadastro" className={btnBlack}>
                  Começar grátis <ChevronRight size={15} />
                </Link>
                <a href="#painel" className={btnGhost} style={{ color: C.text, border: `1px solid ${C.border}` }}>
                  Ver demonstração
                </a>
              </div>

              <div className="flex items-center gap-6">
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

            {/* RIGHT — layered composition */}
            <div className="relative flex items-center justify-center md:justify-end">

              {/* Orange circle accent (top-right) */}
              <div className="absolute -top-4 right-8 w-10 h-10 rounded-full z-10 pointer-events-none"
                style={{ background: C.accent }} />

              {/* Thin connector line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-28 pointer-events-none"
                style={{ background: `linear-gradient(to bottom, transparent, ${C.border}, transparent)` }} />

              {/* Main browser mockup */}
              <div className="relative w-full max-w-[540px] rounded-2xl overflow-hidden shadow-2xl z-[2]"
                style={{ border: `1.5px solid ${C.border}` }}>
                {/* Chrome */}
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

              {/* Floating card — margem */}
              <div className="absolute -left-6 md:-left-10 top-[18%] z-[3] rounded-xl px-4 py-3 shadow-xl"
                style={{ background: C.surface, border: `1px solid ${C.border}`, minWidth: 136 }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>Margem média</p>
                <p className="text-[1.6rem] font-black leading-none" style={{ color: C.text }}>16%</p>
                <div className="mt-2 h-1 rounded-full w-20" style={{ background: C.bg2 }}>
                  <div className="h-full rounded-full w-[16%]" style={{ background: C.accent }} />
                </div>
              </div>

              {/* Floating card — receita */}
              <div className="absolute -right-3 md:-right-6 bottom-[16%] z-[3] rounded-xl px-4 py-3 shadow-xl"
                style={{ background: "#1A1A1A", minWidth: 150 }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Receita este mês</p>
                <p className="text-xl font-black text-white leading-none mb-1">R$5.1k</p>
                <p className="text-[11px] flex items-center gap-1" style={{ color: "#34D399" }}>
                  <TrendingUp size={11} /> +12% vs. mês anterior
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ PROBLEMA / VALOR ════════════════════════════════════ */}
        <section style={{ background: C.bg2 }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: C.accent }}>O problema real</p>
              <h2 className="text-3xl md:text-[2.5rem] font-black leading-[1.1] mb-7" style={{ color: C.text }}>
                Muita gente vende todos os dias sem saber{" "}
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
                  exatamente
                </span>{" "}
                quanto está ganhando.
              </h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: C.muted }}>
                Quando custo, insumos, despesas e preço de venda ficam espalhados, a operação perde clareza. O resultado aparece no caixa, mas a margem real continua escondida.
              </p>
              <p className="text-base leading-relaxed" style={{ color: C.muted }}>
                O Precifica foi pensado para transformar números soltos em decisões mais simples. Você entende melhor seus custos, monta fichas técnicas com mais segurança e precifica com mais confiança.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Custo real por produto",   value: "R$ 14,50", sub: "Via ficha técnica",   dark: false },
                  { label: "Margem de contribuição",   value: "38%",      sub: "Meta superada",       dark: true  },
                  { label: "Despesas fixas/mês",       value: "R$ 5.029", sub: "Registradas no painel", dark: false },
                  { label: "Ponto de equilíbrio",      value: "R$ 80.2k", sub: "Meta mensal",         dark: false },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl p-5"
                    style={{ background: c.dark ? "#1A1A1A" : C.surface, border: `1px solid ${c.dark ? "transparent" : C.border}` }}>
                    <p className="text-[11px] font-semibold mb-2" style={{ color: c.dark ? "rgba(255,255,255,0.45)" : C.muted }}>{c.label}</p>
                    <p className="text-[1.65rem] font-black leading-none" style={{ color: c.dark ? "#ffffff" : C.text }}>{c.value}</p>
                    <p className="text-xs mt-1.5" style={{ color: c.dark ? "rgba(255,255,255,0.35)" : C.muted }}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ COMO FUNCIONA ═══════════════════════════════════════ */}
        <section id="como-funciona" style={{ background: C.bg }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="mb-16">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Como funciona</p>
                <h2 className="text-3xl md:text-[2.5rem] font-black leading-tight max-w-xl" style={{ color: C.text }}>
                  Tudo o que você precisa em um fluxo simples
                </h2>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { n: "01", icon: <LayoutDashboard size={18} />, title: "Cadastre produtos e insumos",       text: "Organize a base do seu negócio em um só lugar para parar de depender de anotações espalhadas e cálculos manuais." },
                { n: "02", icon: <BookOpen size={18} />,        title: "Monte fichas técnicas",             text: "Defina ingredientes, quantidades, rendimento e custo de preparo para entender melhor quanto cada item realmente custa." },
                { n: "03", icon: <Wallet size={18} />,          title: "Registre despesas e lançamentos",   text: "Acompanhe saídas, entradas e custos fixos do dia a dia com mais clareza e menos improviso." },
                { n: "04", icon: <TrendingUp size={18} />,      title: "Entenda margem e resultado",        text: "Visualize indicadores importantes do negócio e tome decisões com mais base, seja para ajustar preço, reduzir desperdício ou melhorar lucro." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 60}>
                  <div className="group rounded-2xl p-7 h-full transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start gap-5">
                      <span className="text-[2.2rem] font-black leading-none shrink-0 mt-0.5 select-none"
                        style={{ color: C.border }}>
                        {s.n}
                      </span>
                      <div>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-colors"
                          style={{ background: C.bg2, color: C.accent }}>
                          {s.icon}
                        </div>
                        <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>{s.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{s.text}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SHOWCASE DO PAINEL ══════════════════════════════════ */}
        <section id="painel" style={{ background: "#1A1A1A" }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="max-w-2xl mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.accent }}>O painel</p>
                <h2 className="text-3xl md:text-[2.5rem] font-black leading-tight text-white mb-4">
                  Uma visão mais clara do negócio,{" "}
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400, opacity: 0.7 }}>
                    sem complicar
                  </span>{" "}
                  a rotina
                </h2>
                <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  No painel, você acompanha os números mais importantes em um só lugar: receita, custos, margem média, ponto de equilíbrio, despesas, lançamentos recentes e desempenho dos produtos.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-1.5 px-4 h-9" style={{ background: "#111", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  <span className="mx-auto text-[11px] px-14 rounded h-5 flex items-center"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                    precifica.app/painel
                  </span>
                </div>
                <img src={dashboardImg} alt="Painel completo do Precifica com métricas de receita, custos, margem e ponto de equilíbrio para gestão de negócios de alimentação" className="w-full block" draggable={false} />
              </div>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[["Receita", "Entradas por período"], ["Margem Média", "Saúde do portfólio"], ["P. Equilíbrio", "Meta de faturamento"], ["Top Produtos", "Ranking de desempenho"]].map(([t, s]) => (
                <Reveal key={t}>
                  <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-semibold text-white mb-0.5">{t}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TIPOS DE NEGÓCIO ════════════════════════════════════ */}
        <section style={{ background: C.bg }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="mb-16">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Para o seu negócio</p>
                <h2 className="text-3xl md:text-[2.5rem] font-black leading-tight max-w-xl" style={{ color: C.text }}>
                  Feito para a rotina real de quem trabalha com alimentação
                </h2>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <UtensilsCrossed size={18} />, title: "Restaurantes",  text: "Entenda melhor o custo dos pratos, acompanhe despesas da operação e tenha mais segurança para ajustar preços sem perder competitividade." },
                { icon: <ShoppingBag size={18} />,     title: "Marmitarias",   text: "Organize produção, ingredientes e rendimento para precificar com mais consistência e proteger sua margem mesmo em volumes maiores." },
                { icon: <Coffee size={18} />,          title: "Confeitarias",  text: "Tenha mais controle sobre ingredientes, porções, embalagens e custos de produção para evitar preços abaixo do necessário." },
                { icon: <Sandwich size={18} />,        title: "Lanchonetes",   text: "Acompanhe custos de insumos, combos e itens de giro rápido com mais clareza para vender melhor e reduzir distorções no preço." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <div className="group rounded-2xl p-7 flex gap-5 items-start transition-all hover:shadow-md cursor-default"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: C.bg2, color: C.accent }}>
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{b.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BENEFÍCIOS ══════════════════════════════════════════ */}
        <section style={{ background: C.bg2 }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <h2 className="text-3xl md:text-[2.5rem] font-black leading-tight mb-16 max-w-lg" style={{ color: C.text }}>
                Mais clareza para{" "}
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
                  decidir melhor
                </span>
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-x-20 gap-y-10 max-w-3xl">
              {[
                { title: "Menos planilhas confusas",     text: "Centralize informações importantes em uma experiência mais prática e fácil de acompanhar." },
                { title: "Mais segurança na precificação", text: "Saiba melhor quanto custa produzir e tenha mais confiança na hora de formar preço." },
                { title: "Melhor leitura do resultado",  text: "Visualize números essenciais do negócio sem depender de interpretações complicadas." },
                { title: "Mais organização no dia a dia", text: "Ganhe tempo na rotina e reduza o retrabalho com uma base de dados mais estruturada." },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 70}>
                  <div className="flex gap-4 items-start">
                    <span className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ background: C.accent }} />
                    <div>
                      <h3 className="text-base font-bold mb-1.5" style={{ color: C.text }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{b.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PLANOS ══════════════════════════════════════════════ */}
        <section id="precos" style={{ background: C.bg }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Planos</p>
                <h2 className="text-3xl md:text-[2.5rem] font-black leading-tight max-w-2xl mb-3" style={{ color: C.text }}>
                  Escolha o plano que faz sentido para o seu momento
                </h2>
                <p className="text-base max-w-xl" style={{ color: C.muted }}>
                  Comece grátis e avance conforme o seu negócio precisar de mais controle, recursos e profundidade de análise.
                </p>
              </div>

              {/* Toggle */}
              <div className="flex mb-10">
                <div className="inline-flex items-center p-1 rounded-full" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                  <button onClick={() => setAnual(false)} className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                    style={!anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>
                    Mensal
                  </button>
                  <button onClick={() => setAnual(true)} className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                    style={anual ? { background: "#1A1A1A", color: "#fff" } : { color: C.muted }}>
                    Anual <span className="ml-1 text-xs opacity-70">2 meses grátis</span>
                  </button>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {/* Grátis */}
              <Reveal>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>Grátis</h3>
                  <p className="text-sm mb-6" style={{ color: C.muted }}>Para começar e conhecer a lógica da plataforma.</p>
                  <div className="mb-6"><span className="text-4xl font-black" style={{ color: C.text }}>R$ 0</span><span className="text-sm ml-1" style={{ color: C.muted }}>/mês</span></div>
                  <Link href="/cadastro">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:bg-[#1A1A1A] hover:text-white border mb-7" style={{ borderColor: C.border, color: C.text }}>
                      Começar grátis
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Até 5 produtos","Até 10 fichas técnicas","Até 30 insumos","Cálculo de CMV"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}>
                        <Check size={13} style={{ color: C.accent }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Pro */}
              <Reveal delay={80}>
                <div className="rounded-2xl p-7 relative md:-mt-5 shadow-xl" style={{ background: "#1A1A1A", border: `2px solid ${C.accent}` }}>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full text-white" style={{ background: C.accent }}>
                    Mais popular
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-white">Pro</h3>
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>Para quem já precisa de mais controle na operação e na precificação.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">R$ {fmt(anual ? PRICES.pro.a : PRICES.pro.m)}</span>
                    <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.97] mb-7 text-white" style={{ background: C.accent }}>
                      Assinar Pro
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Produtos ilimitados","Fichas técnicas ilimitadas","Insumos ilimitados","Cálculo de margem real","Dashboard de custos","Alertas de margem baixa"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-white">
                        <Check size={13} style={{ color: C.accent }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Premium */}
              <Reveal delay={160}>
                <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>Premium</h3>
                  <p className="text-sm mb-6" style={{ color: C.muted }}>Para quem quer uma gestão mais completa, com visão mais estratégica do negócio.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black" style={{ color: C.text }}>R$ {fmt(anual ? PRICES.premium.a : PRICES.premium.m)}</span>
                    <span className="text-sm ml-1" style={{ color: C.muted }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos">
                    <button className={btnBlack + " w-full justify-center mb-7"}>Assinar Premium</button>
                  </Link>
                  <div className="space-y-3">
                    {["Tudo do plano Pro","Gestão de despesas fixas","Fluxo de caixa","Ponto de equilíbrio","Relatórios avançados","Controle de funcionários"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.text }}>
                        <Check size={13} style={{ color: C.accent }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={80}>
              <p className="text-sm mt-7" style={{ color: C.muted }}>
                Planos mensal e anual disponíveis. Você pode começar pelo grátis e evoluir no seu ritmo.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════════ */}
        <section id="duvidas" style={{ background: C.bg2 }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-2xl mx-auto">
            <Reveal>
              <h2 className="text-3xl md:text-[2.5rem] font-black mb-12" style={{ color: C.text }}>Dúvidas frequentes</h2>
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
        <section style={{ background: "#1A1A1A" }} className="py-24 md:py-32 px-6 md:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <Reveal>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-8" style={{ background: C.accent }}>
                <BarChart3 size={20} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-[2.5rem] font-black text-white mb-5 leading-tight">
                Comece a olhar para seus números com mais{" "}
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 400, opacity: 0.7 }}>
                  clareza
                </span>
              </h2>
              <p className="text-base mb-9 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Organize custos, acompanhe a margem dos seus produtos e tome decisões com mais segurança no dia a dia do seu negócio.
              </p>
              <Link href="/cadastro">
                <button className="h-12 px-9 rounded-full font-semibold text-[#1A1A1A] text-base transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ background: "#ffffff" }}>
                  Começar grátis <ArrowRight size={15} className="inline ml-1" />
                </button>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-10 px-6 md:px-12">
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
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Precifica. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
