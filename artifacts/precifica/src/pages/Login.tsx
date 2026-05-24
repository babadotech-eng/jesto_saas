import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast.error("E-mail não confirmado", {
          description: "Verifique sua caixa de entrada e clique no link de confirmação.",
        });
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else {
        toast.error("Erro ao entrar", { description: error.message });
      }
      return;
    }

    toast.success("Bem-vindo de volta!");
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-primary text-primary-foreground p-3 rounded-xl mb-4 shadow-md hover:scale-105 transition-transform">
            <BarChart3 size={32} />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Precifica</h1>
          <p className="text-muted-foreground mt-2">Seu negócio de comida, no controle.</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-primary font-medium hover:underline">
                Criar conta grátis
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
