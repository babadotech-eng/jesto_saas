import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Layout from "@/components/Layout";
import Painel from "@/pages/Painel";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import Planos from "@/pages/Planos";
import Produtos from "@/pages/Produtos";
import Insumos from "@/pages/Insumos";
import FichaTecnica from "@/pages/FichaTecnica";
import Lancamentos from "@/pages/Lancamentos";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Funcionarios from "@/pages/Funcionarios";
import Onboarding from "@/pages/Onboarding";
import AdminPanel from "@/pages/admin/AdminPanel";
import RedefinirSenha from "@/pages/RedefinirSenha";
import CheckoutPage from "@/pages/CheckoutPage";
import PagamentoRetorno from "@/pages/PagamentoRetorno";
import { toast } from "sonner";
import { usePerfil, PerfilError } from "@/hooks/usePerfil";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
});

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: "#4D2F70" }} />
        Carregando...
      </div>
    </div>
  );
}

function PendingCupomApplier() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) return;
    const cupomCode = sessionStorage.getItem("pendingCupomCode");
    const plano = sessionStorage.getItem("pendingPlano");
    if (!cupomCode || !plano) return;
    sessionStorage.removeItem("pendingCupomCode");
    sessionStorage.removeItem("pendingPlano");

    fetch("/api/assinaturas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plano, cupomCode }),
    }).catch(() => {});
  }, [session]);

  return null;
}

function PendingCheckoutRedirector() {
  const { session } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!session?.access_token) return;
    const plano = sessionStorage.getItem("pendingCheckoutPlano");
    if (!plano) return;
    const ciclo = sessionStorage.getItem("pendingCheckoutCiclo") ?? "mensal";
    const cupom = sessionStorage.getItem("pendingCheckoutCupom") ?? "";
    sessionStorage.removeItem("pendingCheckoutPlano");
    sessionStorage.removeItem("pendingCheckoutCiclo");
    sessionStorage.removeItem("pendingCheckoutCupom");
    const cupomParam = cupom ? `&cupom=${encodeURIComponent(cupom)}` : "";
    navigate(`/checkout?plano=${plano}&ciclo=${ciclo}${cupomParam}`);
  }, [session]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { data: perfil, isLoading: perfilLoading, error: perfilError } = usePerfil(!!session);

  useEffect(() => {
    if (perfilError instanceof PerfilError && perfilError.status === 410) {
      signOut().then(() => {
        toast.error("Conta desativada. Seus dados ficam preservados por até 3 meses.");
        setLocation("/");
      });
    }
  }, [perfilError]);

  if (loading || (session && perfilLoading)) return <Loading />;
  if (!session) return <Redirect to="/login" />;
  if (perfil && !perfil.nome_completo) return <Redirect to="/onboarding" />;
  return <Layout><Component /></Layout>;
}

function OnboardingRoute() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect to="/login" />;
  return <Onboarding />;
}

const ADMIN_EMAIL = "michelkhodair@gmail.com";

function AdminLoginGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else {
        toast.error("Erro ao entrar", { description: error.message });
      }
    }
    // on success the AuthProvider updates session and AdminRoute re-renders
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Acesso Administrativo</h1>
          <p className="text-muted-foreground mt-2 text-sm">Entre com sua conta de administrador</p>
        </div>
        <Card className="shadow-xl border-white/10 bg-[#161722]">
          <CardContent className="space-y-4 !pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-zinc-300">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-zinc-300">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/60"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base bg-yellow-400 hover:bg-yellow-300 text-[#1A1A1A] font-semibold"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDenied() {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">🚫</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Acesso negado</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Sua conta não tem permissão para acessar a área administrativa.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          Sair e voltar ao início
        </Button>
      </div>
    </div>
  );
}

function AdminRoute() {
  const { session, loading, user } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <AdminLoginGate />;
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL) return <AdminDenied />;
  return <AdminPanel />;
}

function PublicRoute({ component: Component, restricted = false }: { component: React.ComponentType; restricted?: boolean }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (session && restricted) return <Redirect to="/painel" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><PublicRoute component={Landing} /></Route>
      <Route path="/login"><PublicRoute component={Auth} restricted /></Route>
      <Route path="/cadastro"><PublicRoute component={Auth} restricted /></Route>
      <Route path="/planos"><PublicRoute component={Planos} /></Route>
      <Route path="/checkout"><PublicRoute component={CheckoutPage} /></Route>
      <Route path="/pagamento/retorno"><PublicRoute component={PagamentoRetorno} /></Route>
      <Route path="/onboarding"><OnboardingRoute /></Route>
      <Route path="/painel"><ProtectedRoute component={Painel} /></Route>
      {/* Legacy redirect */}
      <Route path="/dashboard"><Redirect to="/painel" /></Route>
      <Route path="/produtos"><ProtectedRoute component={Produtos} /></Route>
      <Route path="/insumos"><ProtectedRoute component={Insumos} /></Route>
      <Route path="/ficha-tecnica"><ProtectedRoute component={FichaTecnica} /></Route>
      <Route path="/lancamentos"><ProtectedRoute component={Lancamentos} /></Route>
      {/* Legacy redirect — /despesas foi unificado em /lancamentos */}
      <Route path="/despesas"><Redirect to="/lancamentos" /></Route>
      <Route path="/relatorios"><ProtectedRoute component={Relatorios} /></Route>
      <Route path="/funcionarios"><ProtectedRoute component={Funcionarios} /></Route>
      <Route path="/configuracoes"><ProtectedRoute component={Configuracoes} /></Route>
      <Route path="/redefinir-senha"><PublicRoute component={RedefinirSenha} /></Route>
      <Route path="/admin"><AdminRoute /></Route>
      <Route path="/admin/usuarios"><AdminRoute /></Route>
      <Route path="/admin/assinaturas"><AdminRoute /></Route>
      <Route path="/admin/financeiro"><AdminRoute /></Route>
      <Route path="/admin/codigos"><AdminRoute /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PendingCupomApplier />
          <PendingCheckoutRedirector />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
