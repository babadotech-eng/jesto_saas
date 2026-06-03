import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const C = {
  bg:      "#ECEAE5",
  surface: "#F5F4F1",
  text:    "#1A1A1A",
  muted:   "#6B6864",
  border:  "#C8C3BB",
  accent:  "#4B2B69",
};

type PageStatus = "polling" | "ativo" | "pendente" | "erro";

export default function PagamentoRetorno() {
  const [, navigate] = useLocation();
  const { session } = useAuth();
  const [status, setStatus] = useState<PageStatus>("polling");
  const [plano, setPlano] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      setStatus("pendente");
      return;
    }

    async function checkAssinatura() {
      try {
        const res = await fetch("/api/assinaturas/current", {
          headers: { Authorization: `Bearer ${session!.access_token}` },
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json() as { plano?: string; status?: string };

        if (data.status === "ativo" && data.plano && data.plano !== "gratis") {
          setPlano(data.plano);
          setStatus("ativo");
          return;
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= 20) {
          setStatus("pendente");
        } else {
          timerRef.current = setTimeout(checkAssinatura, 3000);
        }
      } catch {
        attemptsRef.current += 1;
        if (attemptsRef.current >= 20) {
          setStatus("erro");
        } else {
          timerRef.current = setTimeout(checkAssinatura, 3000);
        }
      }
    }

    timerRef.current = setTimeout(checkAssinatura, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      attemptsRef.current = 99;
    };
  }, [session]);

  const PLAN_LABELS: Record<string, string> = { pro: "Pro", premium: "Premium" };

  if (status === "polling") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Loader2 size={40} style={{ color: C.accent, marginBottom: "1.25rem" }} className="animate-spin" />
          <h1 style={titleStyle}>Verificando pagamento...</h1>
          <p style={subStyle}>
            Aguarde enquanto confirmamos seu pagamento. Isso pode levar alguns instantes.
          </p>
        </div>
      </div>
    );
  }

  if (status === "ativo") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <CheckCircle2 size={44} style={{ color: "#16a34a", marginBottom: "1.25rem" }} />
          <h1 style={titleStyle}>Pagamento confirmado!</h1>
          <p style={subStyle}>
            Seu plano <strong>{PLAN_LABELS[plano ?? ""] ?? plano}</strong> está ativo.
            Aproveite todos os recursos disponíveis.
          </p>
          <button
            onClick={() => navigate("/painel")}
            style={btnStyle}
          >
            Acessar o painel
          </button>
        </div>
      </div>
    );
  }

  if (status === "pendente") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Clock size={44} style={{ color: "#d97706", marginBottom: "1.25rem" }} />
          <h1 style={titleStyle}>Pagamento pendente</h1>
          <p style={subStyle}>
            Seu pagamento ainda não foi confirmado. Se você já pagou, a confirmação pode
            levar alguns minutos. Verifique seu e-mail ou o app do banco.
          </p>
          <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: "1.5rem" }}>
            Assim que o pagamento for processado, seu plano será ativado automaticamente.
          </p>
          <button onClick={() => navigate("/painel")} style={btnStyle}>
            Ir para o painel
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ ...btnOutlineStyle, marginTop: "0.75rem" }}
          >
            Verificar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <XCircle size={44} style={{ color: "#dc2626", marginBottom: "1.25rem" }} />
        <h1 style={titleStyle}>Algo deu errado</h1>
        <p style={subStyle}>
          Não conseguimos verificar o status do seu pagamento. Se o valor foi cobrado,
          entre em contato com o suporte.
        </p>
        <button onClick={() => navigate("/planos")} style={btnStyle}>
          Ver planos
        </button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  background: C.bg,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1.5rem",
  fontFamily: "'Satoshi', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  padding: "3rem 2.5rem",
  maxWidth: 440,
  width: "100%",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 900,
  color: C.text,
  marginBottom: "0.75rem",
  letterSpacing: "-0.02em",
};

const subStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: C.muted,
  lineHeight: 1.65,
  marginBottom: "1.75rem",
};

const btnStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 48,
  background: C.text,
  color: "#fff",
  border: "none",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const btnOutlineStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: 44,
  background: "transparent",
  color: C.muted,
  border: `1px solid ${C.border}`,
  borderRadius: 999,
  fontWeight: 600,
  fontSize: "0.875rem",
  cursor: "pointer",
};
