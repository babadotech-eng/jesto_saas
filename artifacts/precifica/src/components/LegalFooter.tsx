import { Link } from "wouter";

interface LegalFooterProps {
  dark?: boolean;
  className?: string;
}

export default function LegalFooter({ dark = true, className = "" }: LegalFooterProps) {
  const color = dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.32)";
  const hoverClass = dark ? "hover:!text-white" : "hover:!text-gray-800";
  const sep = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

  function openConsent() {
    window.dispatchEvent(new Event("openCookieConsent"));
  }

  const linkStyle: React.CSSProperties = { fontSize: "0.72rem", color };

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 ${className}`}
      style={{ gap: "0 12px" }}
    >
      <Link href="/politica-de-privacidade" style={linkStyle} className={`transition-colors ${hoverClass}`}>
        Política de Privacidade
      </Link>
      <span style={{ color: sep, fontSize: "0.65rem" }}>·</span>
      <Link href="/politica-de-cookies" style={linkStyle} className={`transition-colors ${hoverClass}`}>
        Política de Cookies
      </Link>
      <span style={{ color: sep, fontSize: "0.65rem" }}>·</span>
      <Link href="/lgpd" style={linkStyle} className={`transition-colors ${hoverClass}`}>
        LGPD
      </Link>
      <span style={{ color: sep, fontSize: "0.65rem" }}>·</span>
      <button
        onClick={openConsent}
        style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        className={`transition-colors ${hoverClass}`}
      >
        Gerenciar cookies
      </button>
    </div>
  );
}
