import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Check, X, ArrowLeft, Tag, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

type CouponResult = {
  valido: boolean;
  codeId: string;
  tipo: "percentual" | "fixo";
  desconto: number;
  descontoAplicado: number;
  valorOriginal: number;
  valorFinal: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default function Planos() {
  const [anual, setAnual] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPlano, setCouponPlano] = useState<string | null>(null);

  async function handleValidarCupom(plano: string) {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponResult(null);
    setCouponError(null);
    setCouponPlano(plano);
    try {
      const res = await fetch("/api/promo-codes/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: couponCode.trim().toUpperCase(),
          plano,
          pagamento: anual ? "anual" : "mensal",
        }),
      });
      const data = await res.json() as CouponResult & { error?: string };
      if (!res.ok) {
        setCouponError(data.error ?? "Cupom inválido");
      } else {
        setCouponResult(data);
      }
    } catch {
      setCouponError("Erro ao validar o cupom. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleCouponChange(v: string) {
    setCouponCode(v.toUpperCase());
    setCouponResult(null);
    setCouponError(null);
    setCouponPlano(null);
  }

  const proMensal = 49;
  const premiumMensal = 99;
  const proAnual = proMensal * 10;
  const premiumAnual = premiumMensal * 10;

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

          <div className="inline-flex items-center bg-card border border-border p-1 rounded-xl shadow-sm">
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${!anual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setAnual(false); setCouponResult(null); setCouponError(null); }}
            >
              Mensal
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${anual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setAnual(true); setCouponResult(null); setCouponError(null); }}
            >
              Anual <span className="ml-1 text-xs opacity-80">2 meses grátis</span>
            </button>
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
            <div className="mb-2">
              <span className="text-4xl font-black">
                {couponResult && couponPlano === "pro"
                  ? fmt(anual ? couponResult.valorFinal * 10 : couponResult.valorFinal)
                  : fmt(anual ? proAnual : proMensal)}
              </span>
              <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
            </div>
            {couponResult && couponPlano === "pro" && (
              <p className="text-sm text-green-600 font-medium mb-1 line-through decoration-red-500">
                De: {fmt(anual ? proAnual : proMensal)}{anual ? "/ano" : "/mês"}
              </p>
            )}
            <div className="mb-6" />
            <CupomInput
              plano="pro"
              value={couponCode}
              onChange={handleCouponChange}
              onValidar={() => handleValidarCupom("pro")}
              loading={couponLoading && couponPlano === "pro"}
              result={couponPlano === "pro" ? couponResult : null}
              error={couponPlano === "pro" ? couponError : null}
            />
            <Link href="/cadastro" className="w-full mb-8 mt-4">
              <Button className="w-full">Assinar Pro</Button>
            </Link>
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
            <div className="mb-2">
              <span className="text-4xl font-black">
                {couponResult && couponPlano === "premium"
                  ? fmt(anual ? couponResult.valorFinal * 10 : couponResult.valorFinal)
                  : fmt(anual ? premiumAnual : premiumMensal)}
              </span>
              <span className="text-muted-foreground">{anual ? "/ano" : "/mês"}</span>
            </div>
            {couponResult && couponPlano === "premium" && (
              <p className="text-sm text-green-600 font-medium mb-1 line-through decoration-red-500">
                De: {fmt(anual ? premiumAnual : premiumMensal)}{anual ? "/ano" : "/mês"}
              </p>
            )}
            <div className="mb-6" />
            <CupomInput
              plano="premium"
              value={couponCode}
              onChange={handleCouponChange}
              onValidar={() => handleValidarCupom("premium")}
              loading={couponLoading && couponPlano === "premium"}
              result={couponPlano === "premium" ? couponResult : null}
              error={couponPlano === "premium" ? couponError : null}
            />
            <Link href="/cadastro" className="w-full mb-8 mt-4">
              <Button variant="outline" className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar/90 hover:text-sidebar-foreground border-transparent">Assinar Premium</Button>
            </Link>
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

function CupomInput({ plano, value, onChange, onValidar, loading, result, error }: {
  plano: string;
  value: string;
  onChange: (v: string) => void;
  onValidar: () => void;
  loading: boolean;
  result: CouponResult | null;
  error: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cupom de desconto"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="pl-8 text-sm h-9"
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onValidar(); } }}
          />
        </div>
        <Button
          type="button" size="sm" variant="outline"
          className="h-9 px-3 text-xs shrink-0"
          onClick={onValidar}
          disabled={loading || !value.trim()}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {result && (
        <p className="text-xs flex items-center gap-1.5 text-green-600 font-medium">
          <CheckCircle2 size={12} />
          {result.tipo === "percentual"
            ? `${result.desconto}% de desconto aplicado!`
            : `R$ ${result.descontoAplicado.toFixed(2)} de desconto aplicado!`}
        </p>
      )}
      {error && (
        <p className="text-xs flex items-center gap-1.5 text-destructive">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
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
