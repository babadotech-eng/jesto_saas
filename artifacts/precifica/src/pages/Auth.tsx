import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Check, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import imgCaminhar from "@assets/caminhar_1780433938131.png";
import imgEstrada2 from "@assets/estrada_(2)_1780433938132.png";
import imgEstrada from "@assets/estrada_1780433938132.png";
import imgMasp from "@assets/masp_1780433938133.png";
import imgAviao from "@assets/avião_1780433938133.png";
import imgCity from "@assets/city_1780433938134.png";
import imgEscada from "@assets/escada_1780433938134.png";
import imgFarol from "@assets/farol_1780433938135.png";
import imgPonte from "@assets/ponte_1780433938135.png";

const IMAGES = [
  imgCaminhar, imgEstrada2, imgEstrada, imgMasp,
  imgAviao, imgCity, imgEscada, imgFarol, imgPonte,
];

const FRASES = [
  "Bem-vindo de volta.",
  "Grandes resultados começam nos detalhes.",
  "O próximo capítulo do seu negócio começa hoje.",
  "Todo crescimento nasce de decisões consistentes.",
  "Há valor em cada pequena evolução.",
  "O trabalho de hoje constrói os resultados de amanhã.",
  "Algumas conquistas levam tempo. Todas começam com um passo.",
  "O extraordinário é construído diariamente.",
  "Crescer é continuar avançando, mesmo nos dias comuns.",
  "O futuro é criado pelas escolhas feitas hoje.",
  "O progresso raramente faz barulho.",
  "Toda história de sucesso é escrita aos poucos.",
  "Grandes jornadas são feitas de pequenos avanços.",
  "O tempo recompensa quem continua evoluindo.",
  "Nem toda evolução é visível no primeiro dia.",
  "Há força na constância.",
  "As melhores construções acontecem passo a passo.",
  "Cada dia oferece uma nova oportunidade para evoluir.",
  "Boas escolhas criam bons caminhos.",
  "O sucesso costuma nascer da repetição do que funciona.",
  "Todo avanço merece ser reconhecido.",
  "Construir algo duradouro exige paciência e direção.",
  "Há beleza nas coisas feitas com atenção.",
  "O crescimento acontece antes de aparecer.",
  "Pequenos ajustes podem gerar grandes transformações.",
  "Algumas mudanças começam de forma quase imperceptível.",
  "Os melhores resultados costumam amadurecer com o tempo.",
  "Todo caminho relevante é construído aos poucos.",
  "Consistência é uma forma silenciosa de progresso.",
  "O que é construído com cuidado tende a durar.",
  "Clareza ajuda a enxergar novas possibilidades.",
  "Cada decisão carrega o potencial de um novo resultado.",
  "Hoje é uma boa oportunidade para seguir em frente.",
  "Os detalhes moldam aquilo que se torna extraordinário.",
  "O futuro é influenciado pelas escolhas de agora.",
  "Nem sempre é preciso acelerar para continuar evoluindo.",
  "O progresso acontece mesmo quando ainda não é percebido.",
  "Toda conquista começou como uma intenção.",
  "Há valor em continuar, mesmo quando o avanço parece pequeno.",
  "As melhores histórias são construídas dia após dia.",
  "Alguns resultados levam tempo para revelar seu valor.",
  "Cada etapa faz parte de algo maior.",
  "Persistir também é uma forma de avançar.",
  "Existe potencial em tudo o que é feito com propósito.",
  "O crescimento sustentável acontece um dia de cada vez.",
  "Os próximos resultados começam nas ações de hoje.",
  "Grandes realizações raramente acontecem de uma só vez.",
  "Seguir em frente também é uma conquista.",
  "Todo recomeço traz novas possibilidades.",
  "Você está construindo algo que vale a pena.",
];

type AuthState = "login" | "cadastro" | "confirmar" | "recuperar";
type GoTo = (next: AuthState, email?: string) => void;

function passwordValid(p: string) {
  return (
    p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)
  );
}

function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /\d/.test(password) },
    { label: "Um caractere especial (!@#$%...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-gray-700" : "text-gray-400"}`}>
          {c.ok ? <Check size={12} /> : <X size={12} />}
          {c.label}
        </div>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function LightDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-3 text-gray-400">ou</span>
      </div>
    </div>
  );
}

const playfairItalic: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontStyle: "italic",
  fontWeight: 600,
};

function LoginContent({ goTo, setLocation, frase }: { goTo: GoTo; setLocation: (p: string) => void; frase: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast.error("E-mail não confirmado", { description: "Verifique sua caixa de entrada e clique no link de confirmação." });
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else {
        toast.error("Erro ao entrar", { description: error.message });
      }
      return;
    }
    toast.success("Bem-vindo de volta!");
    setLocation("/painel");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/painel` },
    });
    if (error) {
      toast.error("Erro ao entrar com Google", { description: error.message });
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-foreground mb-2" style={{ ...playfairItalic, fontSize: "clamp(28px, 3vw, 38px)", lineHeight: 1.2 }}>
        Seja bem-vindo(a)
      </h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{frase}</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-gray-700 text-sm font-medium">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-gray-700 text-sm font-medium">Senha</Label>
            <button
              type="button"
              onClick={() => goTo("recuperar")}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 text-base bg-[#1a1a1a] hover:bg-zinc-800 text-white font-semibold mt-2"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <LightDivider />

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2.5 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecionando..." : "Entrar com Google"}
      </Button>

      <p className="text-center text-sm text-gray-400 mt-7">
        Não tem conta?{" "}
        <button type="button" onClick={() => goTo("cadastro")} className="text-gray-900 font-semibold hover:underline">
          Criar conta grátis
        </button>
      </p>
    </div>
  );
}

function CadastroContent({ goTo, setLocation }: { goTo: GoTo; setLocation: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (!passwordValid(password)) { toast.error("A senha não atende aos requisitos de segurança"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { toast.error("Erro ao criar conta", { description: error.message }); return; }
    if (data.session) {
      toast.success("Conta criada! Vamos configurar seu negócio.");
      setLocation("/onboarding");
      return;
    }
    goTo("confirmar", email);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/painel` },
    });
    if (error) {
      toast.error("Erro ao entrar com Google", { description: error.message });
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-foreground mb-2" style={{ ...playfairItalic, fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.2 }}>
        Criar conta grátis
      </h1>
      <p className="text-sm text-muted-foreground mb-7">Comece a organizar seu negócio hoje.</p>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2.5 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecionando..." : "Cadastrar com Google"}
      </Button>

      <LightDivider />

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cad-email" className="text-gray-700 text-sm font-medium">Email</Label>
          <Input
            id="cad-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cad-password" className="text-gray-700 text-sm font-medium">Senha</Label>
          <Input
            id="cad-password"
            type="password"
            placeholder="Crie uma senha segura"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
          />
          <PasswordChecklist password={password} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cad-confirm" className="text-gray-700 text-sm font-medium">Confirmar Senha</Label>
          <Input
            id="cad-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold bg-[#1a1a1a] hover:bg-zinc-800 text-white"
          disabled={loading || !passwordValid(password)}
        >
          {loading ? "Criando..." : "Criar Conta Grátis"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Já tem uma conta?{" "}
        <button type="button" onClick={() => goTo("login")} className="text-gray-900 font-semibold hover:underline">
          Fazer login
        </button>
      </p>
    </div>
  );
}

function ConfirmarContent({ email, goTo }: { email: string; goTo: GoTo }) {
  const [countdown, setCountdown] = useState(120);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/painel` },
    });
    setResending(false);
    if (error) { toast.error("Erro ao reenviar", { description: error.message }); return; }
    toast.success("E-mail reenviado! Verifique sua caixa de entrada.");
    setCountdown(120);
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const countdownLabel = countdown > 0
    ? `Aguarde ${mins > 0 ? `${mins}m ` : ""}${secs}s`
    : "Reenviar e-mail";

  return (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="bg-amber-50 text-amber-500 p-4 rounded-full">
          <Mail size={36} />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Confirme seu e-mail</h2>
      <p className="text-sm text-muted-foreground mb-1">Enviamos um link de confirmação para</p>
      <p className="text-sm font-semibold text-foreground mb-4 break-all">{email}</p>
      <p className="text-xs text-gray-400 mb-7">Clique no link recebido para ativar sua conta.</p>
      <div className="space-y-3">
        <Button
          className="w-full h-11 font-semibold bg-[#1a1a1a] hover:bg-zinc-800 text-white"
          onClick={() => goTo("login")}
        >
          Ir para Login
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={handleResend}
          disabled={countdown > 0 || resending}
        >
          {resending ? "Reenviando..." : countdownLabel}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-1"
          onClick={() => goTo("cadastro")}
        >
          ← Voltar e corrigir e-mail
        </button>
      </div>
    </div>
  );
}

function RecuperarContent({ goTo }: { goTo: GoTo }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) { toast.error("Erro ao enviar", { description: error.message }); return; }
    setSent(true);
  };

  return (
    <div>
      <h1 className="text-foreground mb-2" style={{ ...playfairItalic, fontSize: "clamp(26px, 3vw, 34px)", lineHeight: 1.2 }}>
        Recuperar senha
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      {sent ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-amber-100 text-amber-500 p-3 rounded-full">
              <Mail size={28} />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Link enviado!</p>
          <p className="text-xs text-gray-500">
            Enviamos um link de recuperação para o e-mail informado.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rec-email" className="text-gray-700 text-sm font-medium">Email</Label>
            <Input
              id="rec-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-300 focus-visible:border-gray-400"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 text-base bg-[#1a1a1a] hover:bg-zinc-800 text-white font-semibold"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}

      <p className="text-center mt-6">
        <button
          type="button"
          onClick={() => goTo("login")}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Voltar para login
        </button>
      </p>
    </div>
  );
}

export default function Auth() {
  const [location, setLocation] = useLocation();

  const [view, setView] = useState<AuthState>(() =>
    location.includes("cadastro") ? "cadastro" : "login"
  );
  const [visible, setVisible] = useState(true);
  const [confirmarEmail, setConfirmarEmail] = useState("");

  const imageIdx = useMemo(() => Math.floor(Math.random() * IMAGES.length), []);
  const fraseIdx = useMemo(() => Math.floor(Math.random() * FRASES.length), []);

  const goTo = useCallback((next: AuthState, email?: string) => {
    if (email) setConfirmarEmail(email);
    setVisible(false);
    setTimeout(() => {
      setView(next);
      setVisible(true);
    }, 200);
  }, []);

  const image = IMAGES[imageIdx];
  const frase = FRASES[fraseIdx];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── Image panel: hidden mobile, top tablet (order-first), right desktop (lg:order-2) ── */}
      <div className="hidden md:block relative overflow-hidden order-first lg:order-2 md:h-72 md:mx-4 md:mt-4 md:rounded-3xl lg:flex-1 lg:h-auto lg:min-h-screen lg:mx-6 lg:my-6 lg:rounded-[24px]">
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* ── Form panel: left on desktop (lg:order-1), below image on tablet ── */}
      <div className="lg:order-1 lg:flex-none lg:w-[42%] flex flex-col items-center justify-center py-12 px-8 lg:px-14 bg-white">

        {/* Mobile: welcome text (no image on mobile) */}
        <div className="md:hidden w-full max-w-[440px] mb-8">
          <h1 className="text-foreground mb-1" style={{ ...playfairItalic, fontSize: "32px", lineHeight: 1.2 }}>
            Seja bem-vindo(a)
          </h1>
          <p className="text-sm text-muted-foreground">{frase}</p>
        </div>

        {/* Form content */}
        <div
          className="w-full max-w-[440px]"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
        >
          {view === "login" && (
            <LoginContent goTo={goTo} setLocation={setLocation} frase={frase} />
          )}
          {view === "cadastro" && (
            <CadastroContent goTo={goTo} setLocation={setLocation} />
          )}
          {view === "confirmar" && (
            <ConfirmarContent email={confirmarEmail} goTo={goTo} />
          )}
          {view === "recuperar" && (
            <RecuperarContent goTo={goTo} />
          )}
        </div>
      </div>

    </div>
  );
}
