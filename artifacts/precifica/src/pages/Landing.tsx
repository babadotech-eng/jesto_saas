import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart3, Check, ChevronRight, PlayCircle, TrendingUp, BookOpen, Wallet, LayoutDashboard, UtensilsCrossed, Coffee, ShoppingBag, Sandwich, Minus } from "lucide-react";
import dashboardImg from "@assets/Captura_de_tela_27-5-2026_182552_d4272d6d-2b36-4ab1-adf1-6048_1779919697917.jpeg";

function useFadeUp(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeUp();
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const PRICING = {
  pro: { mensal: 19.90, anual: 199.00 },
  premium: { mensal: 39.90, anual: 399.00 },
};

const FAQ_ITEMS = [
  { q: "Preciso entender de finanças para usar?", a: "Não. A proposta do Precifica é justamente tornar os números mais fáceis de visualizar e acompanhar, mesmo para quem não tem formação financeira." },
  { q: "Serve para pequeno negócio?", a: "Sim. O Precifica foi pensado para a realidade de negócios de alimentação que precisam organizar custos, fichas técnicas, despesas e margem de forma mais prática." },
  { q: "Posso testar grátis?", a: "Sim. Você pode começar no plano grátis e conhecer a plataforma antes de decidir avançar para um plano pago." },
  { q: "Funciona no celular?", a: "Sim. A plataforma foi pensada para funcionar bem em diferentes dispositivos, facilitando o acesso no dia a dia." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Você pode gerenciar sua assinatura de forma simples, sem burocracia desnecessária." },
];

export default function Landing() {
  const [anual, setAnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function fmt(v: number) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#F4EEE7", color: "#1F1B17" }}>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(251,247,242,0.88)", borderColor: "#DDD2C6", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-2 font-black text-xl" style={{ color: "#1F1B17" }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: "#F0A11E" }}>
              <BarChart3 size={16} />
            </span>
            Precifica
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: "#6F675F" }}>
            <a href="#como-funciona" className="hover:text-[#1F1B17] transition-colors">Como funciona</a>
            <a href="#painel" className="hover:text-[#1F1B17] transition-colors">Painel</a>
            <a href="#precos" className="hover:text-[#1F1B17] transition-colors">Preços</a>
            <a href="#duvidas" className="hover:text-[#1F1B17] transition-colors">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline text-sm font-medium transition-colors hover:text-[#F0A11E]" style={{ color: "#6F675F" }}>
              Entrar
            </Link>
            <Link href="/cadastro">
              <button className="h-9 px-5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: "#F0A11E" }}>
                Começar grátis
              </button>
            </Link>
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" style={{ color: "#6F675F" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-4 space-y-3 text-sm font-medium" style={{ borderColor: "#DDD2C6", background: "#FBF7F2" }}>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="block" style={{ color: "#6F675F" }}>Como funciona</a>
            <a href="#painel" onClick={() => setMenuOpen(false)} className="block" style={{ color: "#6F675F" }}>Painel</a>
            <a href="#precos" onClick={() => setMenuOpen(false)} className="block" style={{ color: "#6F675F" }}>Preços</a>
            <a href="#duvidas" onClick={() => setMenuOpen(false)} className="block" style={{ color: "#6F675F" }}>Dúvidas</a>
            <Link href="/login" className="block" style={{ color: "#6F675F" }}>Entrar</Link>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section id="inicio" className="relative overflow-hidden" style={{ background: "#F4EEE7" }}>
          <div className="max-w-6xl mx-auto px-5 md:px-10 pt-16 pb-0 md:pt-24 md:pb-0 grid md:grid-cols-2 gap-12 md:gap-8 items-center">

            {/* Left */}
            <div className="space-y-7 pb-16 md:pb-24">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase rounded-full px-3 py-1" style={{ background: "#F7E3B4", color: "#C96A2B" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#F0A11E" }} />
                Teste grátis e entenda melhor a margem do seu negócio
              </div>
              <h1 className="text-4xl md:text-[3.25rem] font-black leading-[1.08] tracking-tight" style={{ color: "#1F1B17" }}>
                Precifique com clareza.<br />
                <span style={{ color: "#F0A11E" }}>Venda com mais lucro.</span>
              </h1>
              <p className="text-lg leading-relaxed max-w-[480px]" style={{ color: "#6F675F" }}>
                O Precifica ajuda negócios de alimentação a organizar custos, montar fichas técnicas, acompanhar despesas e entender a margem real de cada produto com muito mais simplicidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/cadastro">
                  <button className="h-12 px-7 rounded-full font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-md" style={{ background: "#F0A11E", boxShadow: "0 4px 16px rgba(240,161,30,0.28)" }}>
                    Começar grátis <ChevronRight size={16} />
                  </button>
                </Link>
                <a href="#painel">
                  <button className="h-12 px-7 rounded-full font-semibold flex items-center gap-2 transition-all hover:bg-[#EFE6DC] active:scale-95 border" style={{ background: "transparent", borderColor: "#DDD2C6", color: "#1F1B17" }}>
                    <PlayCircle size={16} style={{ color: "#C96A2B" }} />
                    Ver demonstração
                  </button>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-2">
                {[["Grátis para começar", ""], ["Sem cartão obrigatório", ""], ["Dados seguros", ""]].map(([label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#6F675F" }}>
                    <Check size={13} style={{ color: "#F0A11E" }} /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative pb-8 md:pb-0 flex justify-center md:justify-end">
              {/* Browser chrome */}
              <div className="relative rounded-2xl shadow-2xl overflow-hidden w-full max-w-[580px]" style={{ border: "1.5px solid #DDD2C6" }}>
                {/* Chrome bar */}
                <div className="flex items-center gap-1.5 px-4 h-9" style={{ background: "#EFE6DC", borderBottom: "1px solid #DDD2C6" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
                  <span className="mx-auto text-[11px] font-medium px-16 rounded h-5 flex items-center" style={{ background: "#FBF7F2", color: "#6F675F" }}>precifica.app/painel</span>
                </div>
                <img
                  src={dashboardImg}
                  alt="Painel do Precifica mostrando receita, custos, margem média e ponto de equilíbrio"
                  className="w-full block"
                  draggable={false}
                />
              </div>

              {/* Floating card — margem */}
              <div className="absolute -left-4 md:-left-8 top-16 rounded-xl px-4 py-3 shadow-xl" style={{ background: "#FBF7F2", border: "1px solid #DDD2C6", minWidth: 128 }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#6F675F" }}>Margem média</p>
                <p className="text-2xl font-black" style={{ color: "#F0A11E" }}>16%</p>
                <div className="mt-1.5 h-1.5 rounded-full w-20" style={{ background: "#EFE6DC" }}>
                  <div className="h-full rounded-full w-[16%]" style={{ background: "#F0A11E" }} />
                </div>
              </div>

              {/* Floating card — receita */}
              <div className="absolute -right-3 md:-right-6 bottom-20 rounded-xl px-4 py-3 shadow-xl" style={{ background: "#2B241E", border: "1px solid #3a3028", minWidth: 136 }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Receita este mês</p>
                <p className="text-xl font-black text-white">R$5.1k</p>
                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#34D399" }}>
                  <TrendingUp size={11} /> +12% vs. mês anterior
                </p>
              </div>
            </div>
          </div>

          {/* Subtle warm gradient fade to next section */}
          <div className="h-16 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #F4EEE7)" }} />
        </section>

        {/* ── PROBLEM / VALUE ─────────────────────────────────────── */}
        <section style={{ background: "#F4EEE7" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#C96A2B" }}>O problema real</p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-7" style={{ color: "#1F1B17" }}>
                Muita gente vende todos os dias sem saber exatamente quanto está ganhando.
              </h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: "#6F675F" }}>
                Quando custo, insumos, despesas e preço de venda ficam espalhados, a operação perde clareza. O resultado aparece no caixa, mas a margem real continua escondida.
              </p>
              <p className="text-base leading-relaxed" style={{ color: "#6F675F" }}>
                O Precifica foi pensado para transformar números soltos em decisões mais simples. Você entende melhor seus custos, monta fichas técnicas com mais segurança e precifica com mais confiança.
              </p>
            </FadeUp>
            <FadeUp delay={120}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Custo real por produto", value: "R$ 14,50", sub: "Ficha técnica calculada", accent: false },
                  { label: "Margem de contribuição", value: "38%", sub: "Acima do objetivo", accent: true },
                  { label: "Despesas fixas/mês", value: "R$ 5.029", sub: "Registradas no painel", accent: false },
                  { label: "Ponto de equilíbrio", value: "R$ 80.2k", sub: "Meta do mês", accent: false },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl p-5" style={{ background: c.accent ? "#2B241E" : "#FBF7F2", border: `1px solid ${c.accent ? "transparent" : "#DDD2C6"}` }}>
                    <p className="text-[11px] font-semibold mb-2" style={{ color: c.accent ? "rgba(255,255,255,0.5)" : "#6F675F" }}>{c.label}</p>
                    <p className="text-2xl font-black" style={{ color: c.accent ? "#F0A11E" : "#1F1B17" }}>{c.value}</p>
                    <p className="text-xs mt-1" style={{ color: c.accent ? "rgba(255,255,255,0.4)" : "#6F675F" }}>{c.sub}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <section id="como-funciona" style={{ background: "#EFE6DC" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "#C96A2B" }}>Como funciona</p>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-16" style={{ color: "#1F1B17" }}>
                Tudo o que você precisa em um fluxo simples
              </h2>
            </FadeUp>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { n: "01", icon: <LayoutDashboard size={22} />, title: "Cadastre produtos e insumos", text: "Organize a base do seu negócio em um só lugar para parar de depender de anotações espalhadas e cálculos manuais." },
                { n: "02", icon: <BookOpen size={22} />, title: "Monte fichas técnicas", text: "Defina ingredientes, quantidades, rendimento e custo de preparo para entender melhor quanto cada item realmente custa." },
                { n: "03", icon: <Wallet size={22} />, title: "Registre despesas e lançamentos", text: "Acompanhe saídas, entradas e custos fixos do dia a dia com mais clareza e menos improviso." },
                { n: "04", icon: <TrendingUp size={22} />, title: "Entenda margem e resultado", text: "Visualize indicadores importantes do negócio e tome decisões com mais base, seja para ajustar preço, reduzir desperdício ou melhorar lucro." },
              ].map((step, i) => (
                <FadeUp key={step.n} delay={i * 80}>
                  <div className="rounded-2xl p-7 h-full transition-shadow hover:shadow-lg" style={{ background: "#FBF7F2", border: "1px solid #DDD2C6" }}>
                    <div className="flex items-start gap-5">
                      <span className="text-4xl font-black leading-none shrink-0" style={{ color: "#DDD2C6" }}>{step.n}</span>
                      <div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#F7E3B4", color: "#C96A2B" }}>
                          {step.icon}
                        </div>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "#1F1B17" }}>{step.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "#6F675F" }}>{step.text}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── DASHBOARD SHOWCASE ──────────────────────────────────── */}
        <section id="painel" style={{ background: "#2B241E" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "#F0A11E" }}>O painel</p>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-white">
                Uma visão mais clara do negócio, sem complicar a rotina
              </h2>
              <p className="text-center text-base max-w-2xl mx-auto mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                No painel, você acompanha os números mais importantes em um só lugar: receita, custos, margem média, ponto de equilíbrio, despesas, lançamentos recentes e desempenho dos produtos.
              </p>
              <p className="text-center text-sm mb-12" style={{ color: "#F0A11E" }}>
                Tudo com leitura simples, visual limpo e foco no que realmente ajuda na decisão.
              </p>
            </FadeUp>

            <FadeUp delay={100}>
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1.5 px-4 h-9" style={{ background: "#1A1410", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
                  <span className="mx-auto text-[11px] font-medium px-14 rounded h-5 flex items-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>precifica.app/painel</span>
                </div>
                <img
                  src={dashboardImg}
                  alt="Painel completo do Precifica com métricas de receita, custos, margem e ponto de equilíbrio para negócios de alimentação"
                  className="w-full block"
                  draggable={false}
                />
              </div>
            </FadeUp>

            {/* Metric callouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Receita", desc: "Acompanhe entradas por período" },
                { label: "Margem Média", desc: "Saúde real do portfólio" },
                { label: "P. Equilíbrio", desc: "Meta mensal de faturamento" },
                { label: "Top Produtos", desc: "Ranking de desempenho" },
              ].map((m) => (
                <FadeUp key={m.label}>
                  <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-sm font-bold text-white mb-1">{m.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUSINESS TYPES ──────────────────────────────────────── */}
        <section style={{ background: "#F4EEE7" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "#C96A2B" }}>Para o seu negócio</p>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-16" style={{ color: "#1F1B17" }}>
                Feito para a rotina real de quem trabalha com alimentação
              </h2>
            </FadeUp>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: <UtensilsCrossed size={20} />, title: "Restaurantes", text: "Entenda melhor o custo dos pratos, acompanhe despesas da operação e tenha mais segurança para ajustar preços sem perder competitividade." },
                { icon: <ShoppingBag size={20} />, title: "Marmitarias", text: "Organize produção, ingredientes e rendimento para precificar com mais consistência e proteger sua margem mesmo em volumes maiores." },
                { icon: <Coffee size={20} />, title: "Confeitarias", text: "Tenha mais controle sobre ingredientes, porções, embalagens e custos de produção para evitar preços abaixo do necessário." },
                { icon: <Sandwich size={20} />, title: "Lanchonetes", text: "Acompanhe custos de insumos, combos e itens de giro rápido com mais clareza para vender melhor e reduzir distorções no preço." },
              ].map((b, i) => (
                <FadeUp key={b.title} delay={i * 70}>
                  <div className="rounded-2xl p-7 flex gap-5 items-start transition-shadow hover:shadow-lg" style={{ background: "#FBF7F2", border: "1px solid #DDD2C6" }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F7E3B4", color: "#C96A2B" }}>
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: "#1F1B17" }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6F675F" }}>{b.text}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── BENEFITS ─────────────────────────────────────────────── */}
        <section style={{ background: "#EFE6DC" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-16" style={{ color: "#1F1B17" }}>
                Mais clareza para decidir melhor
              </h2>
            </FadeUp>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 max-w-3xl mx-auto">
              {[
                { title: "Menos planilhas confusas", text: "Centralize informações importantes em uma experiência mais prática e fácil de acompanhar." },
                { title: "Mais segurança na precificação", text: "Saiba melhor quanto custa produzir e tenha mais confiança na hora de formar preço." },
                { title: "Melhor leitura do resultado", text: "Visualize números essenciais do negócio sem depender de interpretações complicadas." },
                { title: "Mais organização no dia a dia", text: "Ganhe tempo na rotina e reduza o retrabalho com uma base de dados mais estruturada." },
              ].map((b, i) => (
                <FadeUp key={b.title} delay={i * 80}>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F0A11E" }}>
                      <Check size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1.5" style={{ color: "#1F1B17" }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6F675F" }}>{b.text}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────── */}
        <section id="precos" style={{ background: "#F4EEE7" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "#C96A2B" }}>Planos</p>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-3" style={{ color: "#1F1B17" }}>
                Escolha o plano que faz sentido para o seu momento
              </h2>
              <p className="text-center text-base mb-8 max-w-xl mx-auto" style={{ color: "#6F675F" }}>
                Comece grátis e avance conforme o seu negócio precisar de mais controle, recursos e profundidade de análise.
              </p>

              {/* Toggle */}
              <div className="flex justify-center mb-12">
                <div className="inline-flex items-center p-1 rounded-full" style={{ background: "#EFE6DC", border: "1px solid #DDD2C6" }}>
                  <button
                    onClick={() => setAnual(false)}
                    className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                    style={!anual ? { background: "#F0A11E", color: "#fff", boxShadow: "0 2px 8px rgba(240,161,30,0.3)" } : { color: "#6F675F" }}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setAnual(true)}
                    className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
                    style={anual ? { background: "#F0A11E", color: "#fff", boxShadow: "0 2px 8px rgba(240,161,30,0.3)" } : { color: "#6F675F" }}
                  >
                    Anual <span className="ml-1 text-xs opacity-80">2 meses grátis</span>
                  </button>
                </div>
              </div>
            </FadeUp>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto items-start">
              {/* Grátis */}
              <FadeUp>
                <div className="rounded-2xl p-7 flex flex-col" style={{ background: "#FBF7F2", border: "1px solid #DDD2C6" }}>
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#1F1B17" }}>Grátis</h3>
                  <p className="text-sm mb-6" style={{ color: "#6F675F" }}>Para começar e conhecer a lógica da plataforma.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black" style={{ color: "#1F1B17" }}>R$ 0</span>
                    <span className="text-sm ml-1" style={{ color: "#6F675F" }}>/mês</span>
                  </div>
                  <Link href="/cadastro" className="w-full mb-7">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-80 border" style={{ background: "transparent", borderColor: "#DDD2C6", color: "#1F1B17" }}>
                      Começar grátis
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Até 5 produtos", "Até 10 fichas técnicas", "Até 30 insumos", "Cálculo de CMV"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#1F1B17" }}>
                        <Check size={14} style={{ color: "#F0A11E" }} /> {f}
                      </div>
                    ))}
                    {["Controle de despesas", "Fluxo de caixa", "Relatórios"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#6F675F" }}>
                        <Minus size={14} style={{ color: "#DDD2C6" }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>

              {/* Pro — elevated */}
              <FadeUp delay={80}>
                <div className="rounded-2xl p-7 flex flex-col relative -mt-0 md:-mt-5 shadow-xl" style={{ background: "#2B241E", border: "2px solid #F0A11E" }}>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full text-white" style={{ background: "#F0A11E" }}>
                    Mais popular
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-white">Pro</h3>
                  <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Para quem já precisa de mais controle na operação e na precificação.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black" style={{ color: "#F0A11E" }}>
                      R$ {fmt(anual ? PRICING.pro.anual : PRICING.pro.mensal)}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos" className="w-full mb-7">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: "#F0A11E", color: "#fff" }}>
                      Assinar Pro
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Produtos ilimitados", "Fichas técnicas ilimitadas", "Insumos ilimitados", "Cálculo de margem real", "Dashboard de custos", "Alertas de margem baixa"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-white">
                        <Check size={14} style={{ color: "#F0A11E" }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>

              {/* Premium */}
              <FadeUp delay={160}>
                <div className="rounded-2xl p-7 flex flex-col" style={{ background: "#FBF7F2", border: "1px solid #DDD2C6" }}>
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#1F1B17" }}>Premium</h3>
                  <p className="text-sm mb-6" style={{ color: "#6F675F" }}>Para quem quer uma gestão mais completa, com visão mais estratégica do negócio.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black" style={{ color: "#1F1B17" }}>
                      R$ {fmt(anual ? PRICING.premium.anual : PRICING.premium.mensal)}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "#6F675F" }}>{anual ? "/ano" : "/mês"}</span>
                  </div>
                  <Link href="/planos" className="w-full mb-7">
                    <button className="w-full h-11 rounded-full font-semibold text-sm transition-all hover:opacity-80" style={{ background: "#2B241E", color: "#fff" }}>
                      Assinar Premium
                    </button>
                  </Link>
                  <div className="space-y-3">
                    {["Tudo do plano Pro", "Gestão de despesas fixas", "Fluxo de caixa", "Ponto de equilíbrio", "Relatórios avançados", "Controle de funcionários"].map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#1F1B17" }}>
                        <Check size={14} style={{ color: "#F0A11E" }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            </div>

            <FadeUp delay={100}>
              <p className="text-center text-sm mt-8" style={{ color: "#6F675F" }}>
                Planos mensal e anual disponíveis. Você pode começar pelo grátis e evoluir no seu ritmo.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="duvidas" style={{ background: "#EFE6DC" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-2xl mx-auto">
            <FadeUp>
              <h2 className="text-3xl md:text-4xl font-black text-center mb-12" style={{ color: "#1F1B17" }}>
                Dúvidas frequentes
              </h2>
            </FadeUp>
            <FadeUp delay={80}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-xl overflow-hidden px-5"
                    style={{ background: "#FBF7F2", border: "1px solid #DDD2C6" }}
                  >
                    <AccordionTrigger className="text-sm font-semibold text-left py-4 hover:no-underline" style={{ color: "#1F1B17" }}>
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm pb-4 leading-relaxed" style={{ color: "#6F675F" }}>
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section style={{ background: "#2B241E" }} className="py-20 md:py-28 px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <FadeUp>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-7" style={{ background: "#F0A11E" }}>
                <BarChart3 size={22} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-5 text-white">
                Comece a olhar para seus números com mais clareza
              </h2>
              <p className="text-base mb-9 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Organize custos, acompanhe a margem dos seus produtos e tome decisões com mais segurança no dia a dia do seu negócio.
              </p>
              <Link href="/cadastro">
                <button className="h-13 px-10 py-3.5 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 active:scale-95 shadow-lg" style={{ background: "#F0A11E", boxShadow: "0 4px 24px rgba(240,161,30,0.35)" }}>
                  Começar grátis
                </button>
              </Link>
            </FadeUp>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: "#1A1410", borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-10 px-5 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2 font-black text-lg text-white">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F0A11E" }}>
              <BarChart3 size={14} className="text-white" />
            </span>
            Precifica
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#duvidas" className="hover:text-white transition-colors">Dúvidas</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} Precifica. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
