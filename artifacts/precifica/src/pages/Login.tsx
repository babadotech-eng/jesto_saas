import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BarChart3, Check, X } from "lucide-react";
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
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-white" : "text-zinc-400"}`}>
          {c.ok ? <Check size={12} /> : <X size={12} />}
          {c.label}
        </div>
      ))}
    </div>
  );
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-purple-700 text-white p-3 rounded-xl mb-4 shadow-md hover:scale-105 transition-transform">
            <BarChart3 size={32} />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Precifica</h1>
          <p className="text-muted-foreground mt-2">Entre para começar seu dia com mais controle</p>
        </div>

        <Card className="shadow-xl border-white/10 bg-[#161722]">

          <CardContent className="space-y-4 pt-4">
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <GoogleIcon />
              {googleLoading ? "Redirecionando..." : "Entrar com Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-[#1A1A1A] px-2 text-zinc-500">ou</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/60" />
                <PasswordChecklist password={password} />
              </div>
              <Button type="submit" className="w-full h-11 text-base bg-yellow-400 hover:bg-yellow-300 text-[#1A1A1A] font-semibold" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center text-sm text-zinc-500">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-white font-medium hover:underline">Criar conta grátis</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
