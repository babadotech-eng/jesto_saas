import { Link } from "wouter";
import LegalFooter from "@/components/LegalFooter";
import iconjestoWhite from "@assets/iconjesto_white_1780519861186.webp";

const playfair: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: "italic",
};

export default function Lgpd() {
  return (
    <div style={{ background: "#0f0f17", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: "#161722", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="sticky top-0 z-10 flex items-center justify-between px-5 h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={iconjestoWhite} alt="Jesto" className="w-7 h-7 rounded-lg" />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>← Voltar ao início</span>
        </Link>
      </header>

      {/* Content */}
      <main className="px-4 py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div style={{
            background: "#161722",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 24,
            padding: "36px 32px",
          }}>
            <p style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
              Última atualização: Junho de 2026
            </p>
            <h1 style={{ ...playfair, fontSize: "clamp(26px,4vw,34px)", fontWeight: 700, color: "#fff", marginBottom: 20, lineHeight: 1.2 }}>
              LGPD e Direitos do Titular
            </h1>

            <Section>
              <p>
                A plataforma respeita a Lei Geral de Proteção de Dados Pessoais, Lei nº 13.709/2018, e busca tratar dados pessoais com transparência, segurança e responsabilidade.
              </p>
              <p>
                Esta página apresenta, de forma simples, os principais direitos dos titulares de dados pessoais e o canal para solicitações relacionadas à privacidade.
              </p>
            </Section>

            <Section title="1. Direitos do titular">
              <p>Nos termos da LGPD, o titular de dados pessoais pode solicitar, quando aplicável:</p>
              <ul>
                <li>Confirmação da existência de tratamento de dados pessoais;</li>
                <li>Acesso aos dados pessoais tratados;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
                <li>Portabilidade dos dados, quando aplicável;</li>
                <li>Informação sobre compartilhamento de dados com terceiros;</li>
                <li>Revogação do consentimento;</li>
                <li>Eliminação dos dados pessoais tratados com base no consentimento, quando aplicável;</li>
                <li>Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa;</li>
                <li>Revisão de decisões tomadas exclusivamente com base em tratamento automatizado de dados pessoais, caso existam.</li>
              </ul>
            </Section>

            <Section title="2. Como fazer uma solicitação">
              <p>
                Para exercer seus direitos ou tirar dúvidas sobre privacidade e proteção de dados, entre em contato pelo e-mail:
              </p>
              <p>
                <a href="mailto:soulplat@gmail.com" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
                  soulplat@gmail.com
                </a>
              </p>
              <p>
                Ao enviar uma solicitação, poderemos pedir informações adicionais para confirmar a identidade do solicitante e garantir a segurança dos dados.
              </p>
            </Section>

            <Section title="3. Prazo de resposta">
              <p>
                As solicitações serão analisadas e respondidas dentro de prazo razoável, conforme a complexidade do pedido e as exigências previstas na legislação aplicável.
              </p>
            </Section>

            <Section title="4. Segurança e responsabilidade">
              <p>
                Adotamos medidas razoáveis para proteger os dados pessoais tratados na plataforma.
              </p>
              <p>
                O usuário também é responsável por manter suas credenciais de acesso em segurança e por não compartilhar sua senha com terceiros.
              </p>
            </Section>

            <Section title="5. Atualizações" last>
              <p>
                Esta página poderá ser atualizada para refletir mudanças legais, melhorias na plataforma ou ajustes operacionais.
              </p>
            </Section>
          </div>
        </div>
      </main>

      <footer className="pb-8 pt-2 flex justify-center">
        <LegalFooter />
      </footer>
    </div>
  );
}

function Section({ title, children, last = false }: { title?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28 }}>
      {title && (
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 10 }}>{title}</h2>
      )}
      <div style={{ fontSize: "0.84rem", lineHeight: 1.75, color: "rgba(255,255,255,0.58)" }}
        className="[&>p]:mb-3 [&>ul]:pl-4 [&>ul]:space-y-1 [&>ul>li]:list-disc">
        {children}
      </div>
    </div>
  );
}
