import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, useLocation } from "wouter";
import { Check, ArrowLeft, Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PLAN_PRICES: Record<string, { mensal: number; anual: number }> = {
  pro: { mensal: 19.90, anual: 199.00 },
  premium: { mensal: 39.90, anual: 399.00 },
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
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-12">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Home
        </Link>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">Preços simples para pequenos negócios</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Escolha o plano ideal para a sua operação. Sem surpresas.
          </p>

          <div className="inline-flex items-center bg-card border border-border p-1 rounded-xl shadow-sm mb-8">
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${!anual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setAnual(false); setCupom(null); setCupomErro(""); }}
            >
              Mensal
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${anual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setAnual(true); setCupom(null); setCupomErro(""); }}
            >
              Anual <span className="ml-1 text-xs opacity-80">2 meses grátis</span>
            </button>
          </div>

          {/* Coupon input */}
          <div className="max-w-sm mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 uppercase placeholder:normal-case placeholder:text-muted-foreground"
                  placeholder="Código promocional"
                  value={codigoCupom}
                  onChange={(e) => {
                    setCodigoCupom(e.target.value.toUpperCase());
                    if (cupom || cupomErro) {
                      setCupom(null);
                      setCupomErro("");
                    }
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") validarCupom(); }}
                  disabled={validando}
                />
              </div>
              <Button
                variant="outline"
                onClick={validarCupom}
                disabled={validando || !codigoCupom.trim()}
                className="shrink-0"
              >
                {validando ? <Loader2 size={15} className="animate-spin" /> : "Aplicar"}
              </Button>
            </div>

            {cupom && (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>Cupom válido: {formatarDesconto(cupom)} — será aplicado ao confirmar</span>
              </div>
            )}
            {cupomErro && (
              <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle size={15} className="shrink-0" />
                <span>{cupomErro}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Grátis */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Grátis</h3>
            <p className="text-muted-foreground text-sm mb-6">Para começar com organização, clareza e mais segurança nas primeiras decisões.</p>
            <div className="mb-6">
              <span className="text-4xl font-black">R$ 0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Link href="/cadastro" className="w-full mb-8">
              <Button variant="outline" className="w-full">Começar Grátis</Button>
            </Link>
            <div className="space-y-4 flex-1">
              <Feature text="Estruture seus primeiros produtos com mais confiança" />
              <Feature text="Padronize receitas e ganhe consistência na operação" />
              <Feature text="Organize insumos sem depender de planilhas soltas" />
              <Feature text="Tenha uma leitura mais clara do CMV dos seus produtos" />
              <Feature text="Dê os primeiros passos com simplicidade e sem custo" />
            </div>
          </div>

          {/* Pro */}
          <div className="bg-card rounded-2xl border-2 border-primary p-8 shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-sm">
              Mais Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6">Para quem quer precificar melhor, proteger a margem e crescer com mais controle.</p>
            <div className="mb-6">
              {cupom && descontoPro > 0 ? (
                <div>
                  <span className="text-2xl font-black line-through text-muted-foreground/60">R$ {formatarPreco(precoPro)}</span>
                  <div>
                    <span className="text-4xl font-black text-emerald-500">R$ {formatarPreco(finalPro)}</span>
                    <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-4xl font-black">R$ {formatarPreco(precoPro)}</span>
                  <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
                </div>
              )}
            </div>
            <Button className="w-full mb-8" onClick={() => assinar("pro")} disabled={assinando}>
              {assinando ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Assinar Pro
            </Button>
            <div className="space-y-4 flex-1">
              <Feature text="Cadastre toda a sua operação sem limites desnecessários" />
              <Feature text="Enxergue a margem real de cada item com mais precisão" />
              <Feature text="Tenha uma visão mais clara dos custos no dia a dia" />
              <Feature text="Identifique rapidamente produtos com margem abaixo do ideal" />
              <Feature text="Tome decisões de preço com mais confiança e menos achismo" />
              <Feature text="Ganhe agilidade para ajustar cardápio, custos e rentabilidade" />
            </div>
          </div>

          {/* Premium */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-muted-foreground text-sm mb-6">Para negócios que querem uma visão completa da operação e decisões mais estratégicas.</p>
            <div className="mb-6">
              {cupom && descontoPremium > 0 ? (
                <div>
                  <span className="text-2xl font-black line-through text-muted-foreground/60">R$ {formatarPreco(precoPremium)}</span>
                  <div>
                    <span className="text-4xl font-black text-emerald-500">R$ {formatarPreco(finalPremium)}</span>
                    <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-4xl font-black">R$ {formatarPreco(precoPremium)}</span>
                  <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mb-8 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90 hover:text-sidebar-foreground border-transparent"
              onClick={() => assinar("premium")}
              disabled={assinando}
            >
              {assinando ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
              Assinar Premium
            </Button>
            <div className="space-y-4 flex-1">
              <Feature text="Tudo do plano Pro para elevar o controle da sua operação" />
              <Feature text="Acompanhe despesas fixas com mais profundidade" />
              <Feature text="Tenha mais clareza sobre entradas, saídas e fluxo de caixa" />
              <Feature text="Visualize seu ponto de equilíbrio com mais segurança" />
              <Feature text="Acesse relatórios mais completos para decidir melhor" />
              <Feature text="Organize a estrutura da equipe com mais controle" />
              <Feature text="Consolide custos, rotina e gestão em um só lugar" />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Perguntas frequentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-4 bg-card shadow-sm">
                <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
                  {item.pergunta}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
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
    <div className="flex items-start gap-3">
      <Check size={18} className="text-primary mt-0.5 shrink-0" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
