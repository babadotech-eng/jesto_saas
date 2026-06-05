import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck, CheckCircle2, Tag, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const C = {
  bg:      "#ECEAE5",
  bg2:     "#E6E2DB",
  surface: "#F5F4F1",
  text:    "#1A1A1A",
  muted:   "#6B6864",
  border:  "#C8C3BB",
  accent:  "#4B2B69",
  yellow:  "#FDC203",
};

const PLAN_PRICES = {
  pro:     { mensal: 24.90, anual: 207.50 },
  premium: { mensal: 49.90, anual: 416.00 },
} as const;

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  premium: "Premium",
};

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "Produtos ilimitados",
    "Fichas técnicas ilimitadas",
    "Insumos ilimitados",
    "Cálculo de margem real",
    "Dashboard de custos",
    "Alertas de margem baixa",
  ],
  premium: [
    "Tudo do plano Pro",
    "Gestão de despesas fixas",
    "Fluxo de caixa",
    "Ponto de equilíbrio",
    "Relatórios avançados",
    "Controle de funcionários",
  ],
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

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupomInfo, setCupomInfo] = useState<CupomInfo | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [validando, setValidando] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const plano = params.get("plano");
  const ciclo = (params.get("ciclo") ?? "mensal") as "mensal" | "anual";

  if (!plano || !["pro", "premium"].includes(plano)) {
    navigate("/planos");
    return null;
  }

  const prices = PLAN_PRICES[plano as "pro" | "premium"];
  const valorBase = prices[ciclo];
  const desconto = cupomInfo ? calcularDesconto(cupomInfo, valorBase) : 0;
  const valorFinal = Math.max(0.01, valorBase - desconto);

  async function validarCupom() {
    const codigo = codigoCupom.trim();
    if (!codigo) return;

    setValidando(true);
    setCupomErro("");
    setCupomInfo(null);

    try {
      const res = await fetch(`/api/codigos/validar?codigo=${encodeURIComponent(codigo)}`);
      const data = await res.json() as { valido?: boolean; tipo?: string; desconto?: number; error?: string };

      if (!res.ok) {
        setCupomErro(data.error ?? "Cupom inválido");
      } else {
        setCupomInfo({
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

  async function handlePagar() {
    if (!session?.access_token) {
      sessionStorage.setItem("pendingCheckoutPlano", plano!);
      sessionStorage.setItem("pendingCheckoutCiclo", ciclo);
      if (codigoCupom.trim()) sessionStorage.setItem("pendingCheckoutCupom", codigoCupom.trim());
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { plano: plano!, ciclo };
      if (codigoCupom.trim()) body.cupomCode = codigoCupom.trim();

      const res = await fetch("/api/assinaturas/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { paymentUrl?: string; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao processar pagamento");
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error("Link de pagamento não encontrado. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao conectar com o gateway de pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "3rem 1.5rem", fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <Link href="/planos" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: C.muted, marginBottom: "2rem", textDecoration: "none" }}>
          <ArrowLeft size={16} />
          Voltar para os planos
        </Link>

        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: C.text, marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>
          Resumo do pedido
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: "2rem" }}>
          Confirme os detalhes antes de pagar
        </p>

        {/* Plan card */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: "1.1rem", color: C.text }}>
                Plano {PLAN_LABELS[plano]}
              </p>
              <p style={{ fontSize: "0.8rem", color: C.muted, marginTop: 3 }}>
                Cobrado {ciclo === "mensal" ? "mensalmente" : "anualmente"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {cupomInfo && desconto > 0 ? (
                <>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: C.muted, textDecoration: "line-through", lineHeight: 1 }}>
                    R$ {formatBRL(valorBase)}
                  </p>
                  <p style={{ fontWeight: 900, fontSize: "1.5rem", color: "#16a34a", lineHeight: 1, marginTop: 3 }}>
                    R$ {formatBRL(valorFinal)}
                  </p>
                </>
              ) : (
                <p style={{ fontWeight: 900, fontSize: "1.5rem", color: C.text, lineHeight: 1 }}>
                  R$ {formatBRL(valorBase)}
                </p>
              )}
              <p style={{ fontSize: "0.75rem", color: C.muted, marginTop: 3 }}>
                {ciclo === "mensal" ? "/mês" : "/ano"}
              </p>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }} className="space-y-2">
            {(PLAN_FEATURES[plano] ?? []).map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: C.muted }}>
                <CheckCircle2 size={13} style={{ color: C.accent, flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Annual savings badge */}
        {ciclo === "anual" && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "0.6rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#713f12" }}>
            Plano anual inclui 2 meses grátis em relação ao mensal.
          </div>
        )}

        {/* Coupon field */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.5rem" }}>
            Código promocional
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <Input
                className="pl-8 uppercase placeholder:normal-case"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                placeholder="Código promocional (opcional)"
                value={codigoCupom}
                onChange={(e) => {
                  setCodigoCupom(e.target.value.toUpperCase());
                  if (cupomInfo || cupomErro) { setCupomInfo(null); setCupomErro(""); }
                }}
                onKeyDown={(e) => { if (e.key === "Enter") validarCupom(); }}
                disabled={validando || loading}
              />
            </div>
            <button
              onClick={validarCupom}
              disabled={validando || !codigoCupom.trim() || loading}
              className="shrink-0 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
            >
              {validando ? <Loader2 size={15} className="animate-spin" /> : "Aplicar"}
            </button>
          </div>

          {cupomInfo && (
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#16a34a" }}>
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Cupom válido: {formatarDesconto(cupomInfo)}</span>
            </div>
          )}
          {cupomErro && (
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#dc2626" }}>
              <AlertCircle size={15} className="shrink-0" />
              <span>{cupomErro}</span>
            </div>
          )}
        </div>

        <button
          onClick={handlePagar}
          disabled={loading}
          style={{
            width: "100%",
            height: 52,
            background: C.text,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: "0.875rem",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading && <Loader2 size={17} className="animate-spin" />}
          {loading ? "Aguarde..." : "Continuar para pagamento"}
        </button>

        <p style={{ fontSize: "0.75rem", color: C.muted, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <ShieldCheck size={13} />
          Pagamento seguro via Asaas
        </p>
      </div>
    </div>
  );
}
