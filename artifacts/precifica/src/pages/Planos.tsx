import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Check, X, ArrowLeft, Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
            <p className="text-muted-foreground text-sm mb-6 h-10">Para quem está começando a testar receitas.</p>
            <div className="mb-6">
              <span className="text-4xl font-black">R$ 0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Link href="/cadastro" className="w-full mb-8">
              <Button variant="outline" className="w-full">Começar Grátis</Button>
            </Link>
            <div className="space-y-4 flex-1">
              <Feature text="Até 5 Produtos" />
              <Feature text="Até 10 Fichas Técnicas" />
              <Feature text="Até 30 Insumos" />
              <Feature text="Cálculo de CMV" />
              <Feature text="Sem controle de despesas" missing />
              <Feature text="Sem fluxo de caixa" missing />
              <Feature text="Sem relatórios" missing />
            </div>
          </div>

          {/* Pro */}
          <div className="bg-card rounded-2xl border-2 border-primary p-8 shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-sm">
              Mais Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">Para o negócio que quer controle real dos custos.</p>
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
              <Feature text="Produtos Ilimitados" />
              <Feature text="Fichas Técnicas Ilimitadas" />
              <Feature text="Insumos Ilimitados" />
              <Feature text="Cálculo de Margem Real" />
              <Feature text="Dashboard de Custos" />
              <Feature text="Alertas de Margem Baixa" />
              <Feature text="Sem fluxo de caixa" missing />
              <Feature text="Sem ponto de equilíbrio" missing />
            </div>
          </div>

          {/* Premium */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">Gestão financeira completa de ponta a ponta.</p>
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
              <Feature text="Tudo do plano Pro" />
              <Feature text="Gestão de Despesas Fixas" />
              <Feature text="Fluxo de Caixa (Lançamentos)" />
              <Feature text="Cálculo de Ponto de Equilíbrio" />
              <Feature text="Relatórios Avançados" />
              <Feature text="Controle de Funcionários" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, missing = false }: { text: string; missing?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {missing ? (
        <X size={18} className="text-muted-foreground/50 mt-0.5 shrink-0" />
      ) : (
        <Check size={18} className="text-primary mt-0.5 shrink-0" />
      )}
      <span className={`text-sm ${missing ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>
        {text}
      </span>
    </div>
  );
}
