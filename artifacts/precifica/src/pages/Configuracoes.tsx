import { useAuth } from "@/contexts/AuthContext";
import { useGetAssinatura, useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, CreditCard, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: assinatura, isLoading: loadingAssinatura } = useGetAssinatura();
  const { data: me, isLoading: loadingMe } = useGetMe();

  async function handleSignOut() {
    await signOut();
    toast.success("Você saiu com sucesso.");
    setLocation("/");
  }

  const planLabel = assinatura?.plano === "gratis" ? "Grátis" : assinatura?.plano === "pro" ? "Pro" : "Premium";
  const planColor = assinatura?.plano === "gratis" ? "bg-muted text-muted-foreground" : assinatura?.plano === "pro" ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-700";

  return (
    <div className="space-y-6 max-w-2xl" data-testid="configuracoes-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e plano</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={18} className="text-primary" />
          <h2 className="font-semibold">Perfil</h2>
        </div>
        {loadingMe ? <Skeleton className="h-16 w-full" /> : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground" data-testid="text-user-email">{me?.email ?? user?.email ?? "Usuário"}</p>
              <p className="text-sm text-muted-foreground">Conta ativa</p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={18} className="text-primary" />
          <h2 className="font-semibold">Plano Atual</h2>
        </div>
        {loadingAssinatura ? <Skeleton className="h-16 w-full" /> : assinatura ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={planColor} data-testid="badge-plano">{planLabel}</Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">Ativo</Badge>
              </div>
              {assinatura.valido_ate && (
                <p className="text-sm text-muted-foreground mt-1">Válido até: {new Date(assinatura.valido_ate).toLocaleDateString("pt-BR")}</p>
              )}
              {assinatura.plano === "gratis" && (
                <p className="text-sm text-muted-foreground mt-1">Limite: 1 receita cadastrada</p>
              )}
            </div>
            {assinatura.plano === "gratis" && (
              <Button size="sm" asChild><a href="/planos">Fazer Upgrade</a></Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Sign out */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Encerrar Sessão</p>
            <p className="text-sm text-muted-foreground mt-0.5">Você será redirecionado para a página inicial</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} data-testid="button-signout" className="text-destructive border-destructive/30 hover:bg-destructive/5">
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
