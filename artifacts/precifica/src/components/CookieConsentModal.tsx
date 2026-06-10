import { useState, useEffect } from "react";
import { Link } from "wouter";

const CONSENT_KEY = "cookie-consent";

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  consentDate: string;
}

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(prefs: Omit<CookieConsent, "consentDate">) {
  const consent: CookieConsent = { ...prefs, consentDate: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

type View = "banner" | "customize";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      style={{
        flexShrink: 0,
        width: 38,
        height: 22,
        borderRadius: 11,
        background: checked ? "#7A4FB2" : "rgba(255,255,255,0.14)",
        border: "none",
        cursor: "pointer",
        padding: "0 3px",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        transition: "background 0.2s",
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff" }} />
    </button>
  );
}

export default function CookieConsentModal() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("banner");
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (!getCookieConsent()) {
      timer = setTimeout(() => {
        setOpen(true);
        requestAnimationFrame(() => setVisible(true));
      }, 700);
    }

    const handler = () => {
      setView("banner");
      setAnalytics(false);
      setMarketing(false);
      setOpen(true);
      requestAnimationFrame(() => setVisible(true));
    };
    window.addEventListener("openCookieConsent", handler);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("openCookieConsent", handler);
    };
  }, []);

  if (!open) return null;

  function dismiss(prefs: Omit<CookieConsent, "consentDate">) {
    saveConsent(prefs);
    setVisible(false);
    setTimeout(() => setOpen(false), 300);
  }

  return (
    <div
      className="fixed bottom-0 left-0 z-[9999] p-4 sm:p-5 w-full sm:w-auto pointer-events-none"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto w-full sm:max-w-[490px]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 300ms ease, transform 300ms ease",
          background: "#161722",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 8px 48px rgba(0,0,0,0.55)",
          padding: "26px 26px 22px",
        }}
      >
        {view === "banner" ? (
          <>
            <h2 style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 10,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
            }}>
              Preferências de cookies
            </h2>
            <p style={{ fontSize: "0.83rem", lineHeight: 1.7, color: "rgba(255,255,255,0.62)", marginBottom: 20 }}>
              Usamos cookies necessários para o funcionamento da plataforma e, com sua autorização, cookies de análise para melhorar sua experiência. Você pode aceitar todos, recusar os não essenciais ou personalizar suas preferências.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <button
                onClick={() => dismiss({ necessary: true, analytics: true, marketing: true })}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  background: "#E8F0FE", color: "#161722",
                  fontWeight: 700, fontSize: "0.85rem",
                  border: "none", cursor: "pointer",
                }}
              >
                Aceitar todos
              </button>
              <button
                onClick={() => dismiss({ necessary: true, analytics: false, marketing: false })}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  background: "transparent", color: "rgba(255,255,255,0.82)",
                  fontWeight: 500, fontSize: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer",
                }}
              >
                Recusar não essenciais
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setView("customize")}
                style={{
                  fontSize: "0.77rem", color: "rgba(255,255,255,0.4)",
                  background: "none", border: "none", cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Personalizar
              </button>
              <div className="flex gap-3">
                <Link href="/politica-de-cookies" style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.28)" }}
                  className="hover:text-white transition-colors">
                  Política de Cookies
                </Link>
                <Link href="/politica-de-privacidade" style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.28)" }}
                  className="hover:text-white transition-colors">
                  Privacidade
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
            }}>
              Personalizar preferências
            </h2>

            <div className="space-y-2.5 mb-5">
              {/* Necessários */}
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 12,
                padding: "13px 15px", display: "flex",
                alignItems: "flex-start", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#fff", marginBottom: 2 }}>Necessários</p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.55 }}>
                    Essenciais para login, segurança, sessão e funcionamento da plataforma.
                  </p>
                </div>
                <div style={{
                  flexShrink: 0, width: 38, height: 22, borderRadius: 11,
                  background: "#22c55e", display: "flex",
                  alignItems: "center", justifyContent: "flex-end", padding: "0 3px",
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff" }} />
                </div>
              </div>

              {/* Analíticos */}
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 12,
                padding: "13px 15px", display: "flex",
                alignItems: "flex-start", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#fff", marginBottom: 2 }}>Analíticos</p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.55 }}>
                    Ajudam a entender o uso da plataforma e melhorar recursos.
                  </p>
                </div>
                <Toggle checked={analytics} onChange={() => setAnalytics(v => !v)} label="Cookies analíticos" />
              </div>

              {/* Marketing */}
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 12,
                padding: "13px 15px", display: "flex",
                alignItems: "flex-start", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: "0.84rem", fontWeight: 600, color: "#fff", marginBottom: 2 }}>Marketing</p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.55 }}>
                    Usados para campanhas, anúncios e remarketing, caso sejam ativados no futuro.
                  </p>
                </div>
                <Toggle checked={marketing} onChange={() => setMarketing(v => !v)} label="Cookies de marketing" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
              <button
                onClick={() => dismiss({ necessary: true, analytics, marketing })}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  background: "#E8F0FE", color: "#161722",
                  fontWeight: 700, fontSize: "0.85rem",
                  border: "none", cursor: "pointer",
                }}
              >
                Salvar preferências
              </button>
              <button
                onClick={() => dismiss({ necessary: true, analytics: true, marketing: true })}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  background: "transparent", color: "rgba(255,255,255,0.82)",
                  fontWeight: 500, fontSize: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer",
                }}
              >
                Aceitar todos
              </button>
            </div>
            <button
              onClick={() => setView("banner")}
              style={{
                fontSize: "0.77rem", color: "rgba(255,255,255,0.4)",
                background: "none", border: "none", cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
