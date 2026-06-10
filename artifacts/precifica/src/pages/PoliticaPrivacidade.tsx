import { Link } from "wouter";
import LegalFooter from "@/components/LegalFooter";
import iconjestoWhite from "@assets/iconjesto_white_1780519861186.png";

const playfair: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: "italic",
};

export default function PoliticaPrivacidade() {
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
              Política de Privacidade
            </h1>

            <Section>
              <p>
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos os dados pessoais dos usuários da plataforma.
              </p>
              <p>
                A plataforma foi criada para apoiar negócios de alimentação na organização de informações operacionais, financeiras e comerciais, como produtos, insumos, fichas técnicas, custos, preços, indicadores e dados relacionados à operação do negócio.
              </p>
            </Section>

            <Section title="1. Dados que podemos coletar">
              <p>
                Podemos coletar dados fornecidos diretamente pelo usuário, como nome, e-mail, dados da empresa, informações de cadastro e dados inseridos voluntariamente na plataforma.
              </p>
              <p>
                Também podemos tratar dados relacionados ao uso da plataforma, como registros de acesso, preferências, interações com funcionalidades, informações técnicas do dispositivo, navegador, endereço IP e dados necessários para segurança e funcionamento do sistema.
              </p>
              <p>
                Para usuários que contratam planos pagos, dados relacionados a pagamentos, cobranças e assinaturas podem ser tratados por meio de provedores externos de pagamento, como o Asaas.
              </p>
            </Section>

            <Section title="2. Finalidades do tratamento">
              <p>Os dados podem ser usados para:</p>
              <ul>
                <li>Criar e gerenciar a conta do usuário;</li>
                <li>Permitir o acesso seguro à plataforma;</li>
                <li>Disponibilizar funcionalidades do sistema;</li>
                <li>Armazenar informações inseridas pelo próprio usuário;</li>
                <li>Processar assinaturas, cobranças e pagamentos;</li>
                <li>Melhorar a experiência de uso;</li>
                <li>Prevenir fraudes, falhas técnicas e acessos indevidos;</li>
                <li>Cumprir obrigações legais ou regulatórias;</li>
                <li>Entrar em contato sobre assuntos relacionados à conta, suporte ou funcionamento da plataforma.</li>
              </ul>
            </Section>

            <Section title="3. Bases legais">
              <p>
                O tratamento de dados poderá ocorrer com base na execução de contrato, cumprimento de obrigação legal ou regulatória, legítimo interesse, consentimento do usuário e demais hipóteses previstas na Lei Geral de Proteção de Dados Pessoais, conforme aplicável.
              </p>
            </Section>

            <Section title="4. Compartilhamento de dados">
              <p>
                Podemos compartilhar dados pessoais com fornecedores necessários para o funcionamento da plataforma, como serviços de hospedagem, autenticação, banco de dados, processamento de pagamentos, envio de comunicações e ferramentas técnicas de suporte.
              </p>
              <p>
                Entre os serviços utilizados pela plataforma podem estar provedores como Supabase, Railway, Asaas e outros fornecedores necessários à operação do sistema.
              </p>
              <p>Não vendemos dados pessoais dos usuários.</p>
            </Section>

            <Section title="5. Armazenamento e segurança">
              <p>
                Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda, alteração, divulgação indevida ou destruição.
              </p>
              <p>
                Apesar dos esforços de segurança, nenhum sistema é totalmente imune a riscos. O usuário também deve proteger suas credenciais de acesso e evitar compartilhar sua senha com terceiros.
              </p>
            </Section>

            <Section title="6. Retenção de dados">
              <p>
                Os dados serão mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política, atender obrigações legais, resolver disputas, preservar direitos ou manter o funcionamento da conta enquanto ela estiver ativa.
              </p>
              <p>
                Quando aplicável, o usuário poderá solicitar a exclusão de seus dados, observadas as obrigações legais e operacionais de retenção.
              </p>
            </Section>

            <Section title="7. Direitos do titular">
              <p>Nos termos da LGPD, o usuário pode solicitar, quando aplicável:</p>
              <ul>
                <li>Confirmação da existência de tratamento;</li>
                <li>Acesso aos dados pessoais;</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
                <li>Portabilidade dos dados, quando aplicável;</li>
                <li>Informação sobre compartilhamento de dados;</li>
                <li>Revogação do consentimento;</li>
                <li>Eliminação dos dados tratados com consentimento, quando aplicável;</li>
                <li>Revisão de decisões automatizadas, se houver.</li>
              </ul>
              <p>
                As solicitações podem ser feitas pelo e-mail:{" "}
                <a href="mailto:soulplat@gmail.com" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
                  soulplat@gmail.com
                </a>.
              </p>
            </Section>

            <Section title="8. Dados inseridos pelo usuário">
              <p>
                O usuário é responsável pelas informações que insere na plataforma, incluindo dados de produtos, insumos, preços, custos, fornecedores, fichas técnicas, relatórios e demais informações relacionadas ao seu negócio.
              </p>
              <p>
                A plataforma atua como meio tecnológico para organização desses dados, não sendo responsável pela veracidade, atualização ou legalidade das informações inseridas pelo usuário.
              </p>
            </Section>

            <Section title="9. Cookies e tecnologias semelhantes">
              <p>
                Podemos usar cookies e tecnologias semelhantes para permitir o funcionamento da plataforma, melhorar a experiência de uso e, mediante consentimento, realizar análises de navegação.
              </p>
              <p>
                Mais informações estão disponíveis na{" "}
                <Link href="/politica-de-cookies" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
                  Política de Cookies
                </Link>.
              </p>
            </Section>

            <Section title="10. Alterações nesta política" last>
              <p>
                Esta Política de Privacidade poderá ser atualizada periodicamente para refletir melhorias no sistema, mudanças legais ou alterações operacionais.
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
