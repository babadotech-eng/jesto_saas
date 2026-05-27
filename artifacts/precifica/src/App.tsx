import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

import Layout from "@/components/Layout";
import Painel from "@/pages/Painel";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Cadastro from "@/pages/Cadastro";
import Planos from "@/pages/Planos";
import Produtos from "@/pages/Produtos";
import Insumos from "@/pages/Insumos";
import FichaTecnica from "@/pages/FichaTecnica";
import Despesas from "@/pages/Despesas";
import Lancamentos from "@/pages/Lancamentos";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Funcionarios from "@/pages/Funcionarios";
import Onboarding from "@/pages/Onboarding";
import AdminPanel from "@/pages/admin/AdminPanel";
import RedefinirSenha from "@/pages/RedefinirSenha";
import { usePerfil } from "@/hooks/usePerfil";

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
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session, loading } = useAuth();
  const { data: perfil, isLoading: perfilLoading } = usePerfil(!!session);
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

function AdminRoute() {
  const { session, loading, user } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect to="/login" />;
  if (user?.email?.toLowerCase() !== "michelkhodair@gmail.com") return <Redirect to="/painel" />;
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
      <Route path="/login"><PublicRoute component={Login} restricted /></Route>
      <Route path="/cadastro"><PublicRoute component={Cadastro} restricted /></Route>
      <Route path="/planos"><PublicRoute component={Planos} /></Route>
      <Route path="/onboarding"><OnboardingRoute /></Route>
      <Route path="/painel"><ProtectedRoute component={Painel} /></Route>
      {/* Legacy redirect */}
      <Route path="/dashboard"><Redirect to="/painel" /></Route>
      <Route path="/produtos"><ProtectedRoute component={Produtos} /></Route>
      <Route path="/insumos"><ProtectedRoute component={Insumos} /></Route>
      <Route path="/ficha-tecnica"><ProtectedRoute component={FichaTecnica} /></Route>
      <Route path="/despesas"><ProtectedRoute component={Despesas} /></Route>
      <Route path="/lancamentos"><ProtectedRoute component={Lancamentos} /></Route>
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
