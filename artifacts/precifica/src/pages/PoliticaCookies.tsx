import { Link } from "wouter";
import LegalFooter from "@/components/LegalFooter";
import iconjestoWhite from "@assets/iconjesto_white_1780519861186.webp";

const playfair: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: "italic",
};

export default function PoliticaCookies() {
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
              Política de Cookies
            </h1>

            <Section>
              <p>
                Esta Política de Cookies explica como a plataforma utiliza cookies e tecnologias semelhantes para funcionar corretamente, melhorar a experiência do usuário e oferecer mais segurança durante a navegação.
              </p>
            </Section>

            <Section title="1. O que são cookies">
              <p>
                Cookies são pequenos arquivos armazenados no navegador ou dispositivo do usuário quando ele acessa um site ou aplicação.
              </p>
              <p>
                Eles podem ser usados para lembrar preferências, manter sessões ativas, reforçar a segurança, entender o uso da plataforma e melhorar a experiência de navegação.
              </p>
            </Section>

            <Section title="2. Tipos de cookies que podemos utilizar">
              <p>A plataforma pode utilizar as seguintes categorias de cookies:</p>

              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>Cookies necessários</p>
                <p>
                  São essenciais para o funcionamento da plataforma. Eles permitem recursos como login, autenticação, segurança, sessão do usuário e acesso às áreas protegidas.
                </p>
                <p>
                  Esses cookies não podem ser desativados pelo modal de preferências, pois são necessários para a prestação do serviço.
                </p>
              </div>

              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>Cookies analíticos</p>
                <p>
                  Ajudam a entender como os usuários utilizam a plataforma, quais páginas são acessadas e como podemos melhorar recursos, navegação e desempenho.
                </p>
                <p>Esses cookies somente devem ser ativados mediante consentimento do usuário.</p>
              </div>

              <div style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>Cookies de marketing</p>
                <p>
                  Podem ser usados para campanhas, anúncios, remarketing ou mensuração de publicidade, caso essas ferramentas sejam ativadas no futuro.
                </p>
                <p>Esses cookies somente devem ser ativados mediante consentimento do usuário.</p>
              </div>
            </Section>

            <Section title="3. Consentimento">
              <p>
                Ao acessar a plataforma pela primeira vez, o usuário poderá aceitar todos os cookies, recusar cookies não essenciais ou personalizar suas preferências.
              </p>
              <p>
                As escolhas serão armazenadas no navegador do usuário para que o aviso não seja exibido repetidamente.
              </p>
              <p>
                O usuário poderá alterar suas preferências a qualquer momento por meio da opção "Gerenciar cookies", disponível no rodapé da plataforma.
              </p>
            </Section>

            <Section title="4. Cookies de terceiros">
              <p>
                Algumas funcionalidades podem depender de serviços externos, como autenticação, hospedagem, pagamento, análise de uso ou ferramentas de suporte.
              </p>
              <p>
                Esses terceiros podem utilizar cookies ou tecnologias semelhantes conforme suas próprias políticas de privacidade e cookies.
              </p>
            </Section>

            <Section title="5. Como apagar cookies no navegador">
              <p>
                O usuário pode apagar ou bloquear cookies diretamente nas configurações do navegador.
              </p>
              <p>
                A desativação de cookies necessários pode comprometer o funcionamento da plataforma, especialmente login, autenticação e acesso à conta.
              </p>
            </Section>

            <Section title="6. Alterações nesta política" last>
              <p>
                Esta Política de Cookies poderá ser atualizada para refletir mudanças nas tecnologias utilizadas, novas funcionalidades ou exigências legais.
              </p>
              <p>A versão mais recente estará sempre disponível nesta página.</p>
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
