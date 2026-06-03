import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

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

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const plano = params.get("plano");
  const ciclo = (params.get("ciclo") ?? "mensal") as "mensal" | "anual";
  const cupom = params.get("cupom") ?? "";

  if (!plano || !["pro", "premium"].includes(plano)) {
    navigate("/planos");
    return null;
  }

  const prices = PLAN_PRICES[plano as "pro" | "premium"];
  const valor = prices[ciclo];

  async function handlePagar() {
    if (!session?.access_token) {
      sessionStorage.setItem("pendingCheckoutPlano", plano!);
      sessionStorage.setItem("pendingCheckoutCiclo", ciclo);
      if (cupom) sessionStorage.setItem("pendingCheckoutCupom", cupom);
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { plano: plano!, ciclo };
      if (cupom) body.cupomCode = cupom;

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
              <p style={{ fontWeight: 900, fontSize: "1.5rem", color: C.text, lineHeight: 1 }}>
                R$ {formatBRL(valor)}
              </p>
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

          {cupom && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "0.75rem", marginTop: "1rem", fontSize: "0.82rem", color: C.muted }}>
              Cupom aplicado: <strong style={{ color: C.text }}>{cupom}</strong>
            </div>
          )}
        </div>

        {/* Annual savings badge */}
        {ciclo === "anual" && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "0.6rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#713f12" }}>
            Plano anual inclui 2 meses grátis em relação ao mensal.
          </div>
        )}

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
