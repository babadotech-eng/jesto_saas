import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect to="/login" />;
  return <Layout><Component /></Layout>;
}

function PublicRoute({ component: Component, restricted = false }: { component: React.ComponentType; restricted?: boolean }) {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (session && restricted) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><PublicRoute component={Landing} /></Route>
      <Route path="/login"><PublicRoute component={Login} restricted /></Route>
      <Route path="/cadastro"><PublicRoute component={Cadastro} restricted /></Route>
      <Route path="/planos"><PublicRoute component={Planos} /></Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/produtos"><ProtectedRoute component={Produtos} /></Route>
      <Route path="/insumos"><ProtectedRoute component={Insumos} /></Route>
      <Route path="/ficha-tecnica"><ProtectedRoute component={FichaTecnica} /></Route>
      <Route path="/despesas"><ProtectedRoute component={Despesas} /></Route>
      <Route path="/lancamentos"><ProtectedRoute component={Lancamentos} /></Route>
      <Route path="/relatorios"><ProtectedRoute component={Relatorios} /></Route>
      <Route path="/configuracoes"><ProtectedRoute component={Configuracoes} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
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
