import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BarChart3, Check, X, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";

// NOTE: To enable Google Login, go to your Supabase dashboard:
// Authentication > Providers > Google → enable and add OAuth credentials (Client ID + Secret).
// Then set the redirect URL in Google Cloud Console to: https://<your-domain>/auth/v1/callback

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Um número", ok: /\d/.test(password) },
    { label: "Um caractere especial (!@#$%...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-green-600" : "text-zinc-400"}`}>
          {c.ok ? <Check size={12} /> : <X size={12} />}
          {c.label}
        </div>
      ))}
    </div>
  );
}

function passwordValid(p: string) {
  return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!confirmSent) return;
    setCountdown(120);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [confirmSent]);

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
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

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
    setConfirmSent(true);
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

  if (confirmSent) {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    const countdownLabel = countdown > 0
      ? `Aguarde ${mins > 0 ? `${mins}m ` : ""}${secs}s`
      : "Reenviar e-mail";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 text-primary p-4 rounded-full"><Mail size={36} /></div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Confirme seu e-mail</h1>
          <p className="text-muted-foreground mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta.
          </p>
          <div className="space-y-3">
            <Link href="/login"><Button className="w-full">Ir para Login</Button></Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
            >
              {resending ? "Reenviando..." : countdownLabel}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setConfirmSent(false)}
            >
              ← Voltar e corrigir e-mail
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-primary text-primary-foreground p-3 rounded-xl mb-4 shadow-md hover:scale-105 transition-transform">
            <BarChart3 size={32} />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Criar Conta</h1>
          <p className="text-muted-foreground mt-2">Comece a organizar seu negócio hoje.</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Preencha os dados abaixo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2 border-border hover:bg-zinc-50"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <GoogleIcon />
              {googleLoading ? "Redirecionando..." : "Cadastrar com Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Crie uma senha segura" value={password} onChange={e => setPassword(e.target.value)} required />
                <PasswordChecklist password={password} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading || !passwordValid(password)}>
                {loading ? "Criando..." : "Criar Conta Grátis"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Fazer login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
