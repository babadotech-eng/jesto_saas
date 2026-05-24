import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BarChart3, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [, setLocation] = useLocation();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      toast.error("Erro ao criar conta", { description: error.message });
      return;
    }

    // If session is returned immediately, user is logged in (email confirmation disabled)
    if (data.session) {
      toast.success("Conta criada! Bem-vindo ao Precifica.");
      setLocation("/dashboard");
      return;
    }

    // Otherwise Supabase requires email confirmation
    setConfirmSent(true);
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 text-primary p-4 rounded-full">
              <Mail size={36} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Confirme seu e-mail</h1>
          <p className="text-muted-foreground mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta e então faça login.
          </p>
          <Link href="/login">
            <Button className="w-full">Ir para Login</Button>
          </Link>
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
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
                {loading ? "Criando..." : "Criar Conta Grátis"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
