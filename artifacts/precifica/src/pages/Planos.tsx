import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, useLocation } from "wouter";
import { Check, ArrowLeft, Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const C = {
  bg:        "#ECEAE5",
  bg2:       "#E6E2DB",
  surface:   "#F5F4F1",
  text:      "#1A1A1A",
  muted:     "#6B6864",
  border:    "#C8C3BB",
  accent:    "#4B2B69",
  accentAlt: "#FDC203",
};

const PLAN_PRICES: Record<string, { mensal: number; anual: number }> = {
  pro:     { mensal: 24.90, anual: 207.50 },
  premium: { mensal: 49.90, anual: 416.00 },
};

type CupomInfo = {
  tipo: "percentual" | "fixo";
  desconto: number;
};

function calcularDesconto(cupom: CupomInfo, preco: number) {
  if (cupom.tipo === "percentual") {
    return Math.round(preco * (cupom.desconto / 100) * 100) / 100;
  }
  return Math.min(cupom.desconto, preco);
}

function formatarDesconto(cupom: CupomInfo) {
  if (cupom.tipo === "percentual") {
    return `${cupom.desconto}% de desconto`;
  }
  return `R$ ${cupom.desconto.toFixed(2).replace(".", ",")} de desconto`;
}

const FAQ_ITEMS = [
  {
    pergunta: "Para quem o app foi criado?",
    resposta: "O app foi pensado para pequenos negócios de alimentação que querem profissionalizar a gestão, entender melhor seus números e precificar com mais segurança.",
  },
  {
    pergunta: "Ele funciona para quem ainda está começando?",
    resposta: "Sim. Você pode começar de forma simples, organizar a base da operação e evoluir no seu ritmo, sem precisar dominar planilhas ou processos complexos.",
  },
  {
    pergunta: "O que eu consigo controlar dentro do app?",
    resposta: "Você consegue organizar produtos, insumos, fichas técnicas, CMV, margem, despesas, lançamentos, ponto de equilíbrio e outros indicadores importantes para a rotina do negócio.",
  },
  {
    pergunta: "O app ajuda na formação de preço?",
    resposta: "Sim. Ele foi pensado para dar mais clareza sobre custos e margem, ajudando você a precificar com mais consistência e menos decisões no improviso.",
  },
  {
    pergunta: "Ele calcula CMV e margem?",
    resposta: "Sim. O sistema ajuda você a transformar fichas técnicas e custos cadastrados em uma visão mais clara do CMV e da margem dos seus produtos.",
  },
  {
    pergunta: "Preciso entender de finanças para usar?",
    resposta: "Não. O app foi desenhado para simplificar a gestão e tornar números do dia a dia mais fáceis de interpretar e usar na tomada de decisão.",
  },
  {
    pergunta: "Qual plano faz mais sentido para a maioria dos negócios?",
    resposta: "Para a maioria das operações que já vendem com frequência e querem mais controle, o plano Pro tende a ser a escolha mais equilibrada entre valor e profundidade.",
  },
  {
    pergunta: "Quando vale a pena escolher o Premium?",
    resposta: "O Premium faz mais sentido para quem quer acompanhar a operação de ponta a ponta, com visão mais ampla de caixa, despesas, relatórios e estrutura do negócio.",
  },
  {
    pergunta: "Posso começar no Grátis e mudar depois?",
    resposta: "Sim. Você pode começar no plano gratuito e evoluir para outro plano conforme sua operação crescer e exigir mais controle.",
  },
  {
    pergunta: "O plano anual oferece vantagem?",
    resposta: "Sim. Para quem pretende usar o app de forma contínua, o plano anual costuma entregar uma relação melhor entre investimento e benefício.",
  },
  {
    pergunta: "O app ajuda a controlar despesas fixas?",
    resposta: "Sim. Nos planos mais completos, você passa a enxergar com mais clareza o impacto das despesas fixas sobre o resultado do negócio.",
  },
  {
    pergunta: "Também consigo acompanhar entradas e saídas?",
    resposta: "Sim. O app permite registrar movimentações e acompanhar o fluxo de caixa com mais clareza no dia a dia.",
  },
  {
    pergunta: "Ele mostra o ponto de equilíbrio?",
    resposta: "Sim. O plano Premium ajuda você a visualizar quanto precisa faturar para cobrir seus custos e operar com mais tranquilidade.",
  },
  {
    pergunta: "Como funciona o cupom promocional?",
    resposta: "Se houver um cupom válido para o plano e o período escolhidos, ele pode ser aplicado na contratação para ajustar o valor da assinatura.",
  },
  {
    pergunta: "O app serve para restaurante, lanchonete, confeitaria e delivery?",
    resposta: "Sim. Ele atende diferentes operações de alimentação que precisam organizar custos, receitas, margem e gestão com mais clareza e consistência.",
  },
];

export default function Planos() {
  const [anual, setAnual] = useState(false);
  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupom, setCupom] = useState<CupomInfo | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [validando, setValidando] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [, navigate] = useLocation();
  const { session } = useAuth();

  async function validarCupom() {
    const codigo = codigoCupom.trim();
    if (!codigo) return;

    setValidando(true);
    setCupomErro("");
    setCupom(null);

    try {
      const res = await fetch(`/api/codigos/validar?codigo=${encodeURIComponent(codigo)}`);
      const data = await res.json() as { valido?: boolean; tipo?: string; desconto?: number; error?: string };

      if (!res.ok) {
        setCupomErro(data.error ?? "Cupom inválido");
      } else {
        setCupom({
          tipo: data.tipo as "percentual" | "fixo",
          desconto: data.desconto!,
        });
      }
    } catch {
      setCupomErro("Erro ao validar cupom. Tente novamente.");
    } finally {
      setValidando(false);
    }
  }

  async function assinar(plano: string) {
    if (session?.access_token) {
      setAssinando(true);
      try {
        const body: { plano: string; cupomCode?: string } = { plano };
        if (cupom && codigoCupom.trim()) {
          body.cupomCode = codigoCupom.trim();
        }

        const res = await fetch("/api/assinaturas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json() as { error?: string };
          toast.error(data.error ?? "Erro ao assinar plano");
          return;
        }

        toast.success("Plano atualizado com sucesso!");
        navigate("/painel");
      } catch {
        toast.error("Erro ao processar assinatura. Tente novamente.");
      } finally {
        setAssinando(false);
      }
    } else {
      if (cupom && codigoCupom.trim()) {
        sessionStorage.setItem("pendingCupomCode", codigoCupom.trim());
        sessionStorage.setItem("pendingPlano", plano);
      }
      navigate(`/cadastro?plano=${plano}${anual ? "&periodo=anual" : ""}`);
    }
  }

  const precosPro = PLAN_PRICES["pro"]!;
  const precosPremium = PLAN_PRICES["premium"]!;
  const precoPro = anual ? precosPro.anual : precosPro.mensal;
  const precoPremium = anual ? precosPremium.anual : precosPremium.mensal;

  const descontoPro = cupom ? calcularDesconto(cupom, precoPro) : 0;
  const descontoPremium = cupom ? calcularDesconto(cupom, precoPremium) : 0;
  const finalPro = precoPro - descontoPro;
  const finalPremium = precoPremium - descontoPremium;

  function formatarPreco(valor: number) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "3rem 2.5rem 0" }}>

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12"
          style={{ fontSize: "0.875rem", fontWeight: 500, color: C.muted, textDecoration: "none" }}>
          <ArrowLeft size={16} />
          Voltar para Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 3.5rem" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.24em", color: C.muted, marginBottom: "1.25rem" }}>Planos</p>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.text, marginBottom: "0.75rem" }}>
            Preços simples para pequenos negócios
          </h1>
          <p style={{ fontSize: "1rem", color: C.muted, maxWidth: 440, margin: "0 auto 2.5rem" }}>
            Escolha o plano ideal para a sua operação. Sem surpresas.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 rounded-full mb-8"
            style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
            <button
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={!anual ? { background: C.text, color: "#fff" } : { color: C.muted }}
              onClick={() => { setAnual(false); setCupom(null); setCupomErro(""); }}
            >
              Mensal
            </button>
            <button
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={anual ? { background: C.text, color: "#fff" } : { color: C.muted }}
              onClick={() => { setAnual(true); setCupom(null); setCupomErro(""); }}
            >
              Anual <span style={{ marginLeft: 4, fontSize: "0.75rem", opacity: 0.7 }}>— 2 meses grátis</span>
            </button>
          </div>

          {/* Cupom */}
          <div style={{ maxWidth: 340, margin: "0 auto" }}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                <Input
                  className="pl-8 uppercase placeholder:normal-case"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                  placeholder="Código promocional"
                  value={codigoCupom}
                  onChange={(e) => {
                    setCodigoCupom(e.target.value.toUpperCase());
                    if (cupom || cupomErro) { setCupom(null); setCupomErro(""); }
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") validarCupom(); }}
                  disabled={validando}
                />
              </div>
              <button
                onClick={validarCupom}
                disabled={validando || !codigoCupom.trim()}
                className="shrink-0 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
              >
                {validando ? <Loader2 size={15} className="animate-spin" /> : "Aplicar"}
              </button>
            </div>

            {cupom && (
              <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#16a34a" }}>
                <CheckCircle2 size={15} className="shrink-0" />
                <span>Cupom válido: {formatarDesconto(cupom)} — será aplicado ao confirmar</span>
              </div>
            )}
            {cupomErro && (
              <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#dc2626" }}>
                <AlertCircle size={15} className="shrink-0" />
                <span>{cupomErro}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 items-end">

          {/* Grátis */}
          <div className="rounded-2xl flex flex-col" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "1.75rem", minHeight: 600 }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Grátis</h3>
            <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para começar e entender se o produto faz sentido para você.</p>
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ 0</span>
              <span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>/mês</span>
            </div>
            <Link href="/cadastro">
              <button className="w-full transition-all hover:bg-black/[0.06] active:scale-[0.97]"
                style={{ height: 44, borderRadius: 999, fontWeight: 600, fontSize: "0.875rem", border: `1px solid ${C.border}`, color: C.text, background: "transparent", marginBottom: "1.75rem", cursor: "pointer" }}>
                Começar Grátis
              </button>
            </Link>
            <div className="space-y-3 flex-1">
              <Feature text="Até 5 produtos" />
              <Feature text="Até 10 fichas técnicas" />
              <Feature text="Até 30 insumos" />
              <Feature text="Cálculo de custo e CMV" />
            </div>
          </div>

          {/* Pro — destaque */}
          <div className="rounded-2xl flex flex-col relative" style={{ background: "#1A1A1A", border: `2px solid ${C.accent}`, padding: "2.5rem 1.75rem", minHeight: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: "0.68rem", fontWeight: 700, padding: "3px 14px", borderRadius: 99, background: C.accentAlt, color: "#1A1A1A", whiteSpace: "nowrap" }}>
              Mais Popular
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>Pro</h3>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem" }}>Para quem precisa de mais controle na operação e na precificação.</p>
            <div style={{ marginBottom: "1.5rem" }}>
              {cupom && descontoPro > 0 ? (
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "rgba(255,255,255,0.35)", textDecoration: "line-through" }}>R$ {formatarPreco(anual ? precosPro.mensal * 0.8 : precoPro)}</span>
                  <div>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#4ade80" }}>R$ {formatarPreco(anual ? precosPro.mensal * 0.8 * (finalPro / precoPro) : finalPro)}</span>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>/mês</span>
                  </div>
                  {anual && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>cobrado anualmente.</p>}
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff" }}>R$ {formatarPreco(anual ? precosPro.mensal * 0.8 : precoPro)}</span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>/mês</span>
                  {anual && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>cobrado anualmente.</p>}
                </div>
              )}
            </div>
            <button
              className="w-full transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ height: 44, borderRadius: 999, fontWeight: 600, fontSize: "0.875rem", background: C.accentAlt, color: "#1A1A1A", border: "none", marginBottom: "1.75rem", cursor: "pointer" }}
              onClick={() => assinar("pro")}
              disabled={assinando}
            >
              {assinando ? <Loader2 size={15} className="animate-spin inline mr-2" /> : null}
              Assinar Pro
            </button>
            <div className="space-y-3 flex-1">
              <FeatureDark text="Produtos ilimitados" />
              <FeatureDark text="Fichas técnicas ilimitadas" />
              <FeatureDark text="Insumos ilimitados" />
              <FeatureDark text="Cálculo de margem real" />
              <FeatureDark text="Cálculo de custo e CMV" />
              <FeatureDark text="Dashboard de custos" />
              <FeatureDark text="Alertas de margem baixa" />
            </div>
          </div>

          {/* Premium */}
          <div className="rounded-2xl flex flex-col" style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "1.75rem", minHeight: 600 }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Premium</h3>
            <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>Para uma gestão mais completa, com visão mais estratégica do negócio.</p>
            <div style={{ marginBottom: "1.5rem" }}>
              {cupom && descontoPremium > 0 ? (
                <div>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: `${C.muted}88`, textDecoration: "line-through" }}>R$ {formatarPreco(anual ? precosPremium.mensal * 0.8 : precoPremium)}</span>
                  <div>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#16a34a" }}>R$ {formatarPreco(anual ? precosPremium.mensal * 0.8 * (finalPremium / precoPremium) : finalPremium)}</span>
                    <span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>/mês</span>
                  </div>
                  {anual && <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: 4 }}>cobrado anualmente.</p>}
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: "2.4rem", fontWeight: 900, color: C.text }}>R$ {formatarPreco(anual ? precosPremium.mensal * 0.8 : precoPremium)}</span>
                  <span style={{ fontSize: "0.85rem", color: C.muted, marginLeft: 4 }}>/mês</span>
                  {anual && <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: 4 }}>cobrado anualmente.</p>}
                </div>
              )}
            </div>
            <button
              className="w-full transition-all hover:bg-[#2d2d2d] active:scale-[0.97]"
              style={{ height: 44, borderRadius: 999, fontWeight: 600, fontSize: "0.875rem", background: C.text, color: "#fff", border: "none", marginBottom: "1.75rem", cursor: "pointer" }}
              onClick={() => assinar("premium")}
              disabled={assinando}
            >
              {assinando ? <Loader2 size={15} className="animate-spin inline mr-2" /> : null}
              Assinar Premium
            </button>
            <div className="space-y-3 flex-1">
              <Feature text="Tudo do plano Pro" />
              <Feature text="Gestão de despesas fixas" />
              <Feature text="Fluxo de caixa" />
              <Feature text="Ponto de equilíbrio" />
              <Feature text="Relatórios avançados" />
              <Feature text="Controle de funcionários" />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: C.bg2, marginTop: "6rem", padding: "5rem 2.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.24em", color: C.muted, marginBottom: "1.25rem" }}>Dúvidas</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: "0.75rem" }}>
            Perguntas frequentes
          </h2>
          <p style={{ fontSize: "1rem", lineHeight: 1.8, color: C.muted, marginBottom: "2.75rem" }}>
            Tudo o que você precisa saber para começar a usar a Precifica.
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-xl px-5 overflow-hidden"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                <AccordionTrigger
                  className="text-sm font-semibold text-left py-4 hover:no-underline"
                  style={{ color: C.text }}
                >
                  {item.pergunta}
                </AccordionTrigger>
                <AccordionContent
                  className="text-sm pb-4 leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {item.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm" style={{ color: "#1A1A1A" }}>
      <Check size={13} style={{ color: "#4B2B69", flexShrink: 0, marginTop: 2 }} />
      {text}
    </div>
  );
}

function FeatureDark({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm" style={{ color: "#fff" }}>
      <Check size={13} style={{ color: "#4B2B69", flexShrink: 0, marginTop: 2 }} />
      {text}
    </div>
  );
}
