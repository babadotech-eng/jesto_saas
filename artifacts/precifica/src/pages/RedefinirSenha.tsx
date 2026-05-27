import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { KeyRound, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function RedefinirSenha() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The Supabase SDK detects the recovery token in the URL fragment
    // and emits PASSWORD_RECOVERY. We also check the hash directly as fallback.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setIsReady(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => setLocation("/login"), 2500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={20} className="text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Redefinir Senha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {done ? "Senha atualizada. Redirecionando..." : "Crie uma nova senha para sua conta."}
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={40} className="text-green-500" />
              <p className="text-sm text-muted-foreground text-center">
                Sua senha foi atualizada com sucesso.
              </p>
            </div>
          ) : !isReady ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Verificando link de redefinição...</p>
              <p className="text-xs text-muted-foreground">
                Chegou aqui por engano?{" "}
                <button
                  type="button"
                  className="text-amber-600 hover:underline"
                  onClick={() => setLocation("/login")}
                >
                  Voltar ao login
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Nova Senha"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setLocation("/login")}
                >
                  Cancelar e voltar ao login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
