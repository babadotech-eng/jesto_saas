import { useAuth } from "@/contexts/AuthContext";
import { useGetAssinatura, useGetMe } from "@workspace/api-client-react";
import { usePerfil, useUpdatePerfil } from "@/hooks/usePerfil";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, CreditCard, Settings, Save } from "lucide-react";
import { toast } from "sonner";

const VOLUME_OPTIONS = ["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 7.000", "R$ 7.000 a R$ 15.000", "Acima de R$ 15.000", "Ainda não vendo"];

export default function Configuracoes() {
  const { signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: assinatura, isLoading: loadingAssinatura } = useGetAssinatura();
  const { data: me, isLoading: loadingMe } = useGetMe();
  const { data: perfil, isLoading: loadingPerfil } = usePerfil();
  const updatePerfil = useUpdatePerfil();

  const [form, setForm] = useState({
    nome_completo: "", nome_negocio: "", tipo_negocio: "",
    volume_mensal: "", cidade_estado: "", whatsapp: "",
  });

  useEffect(() => {
    if (perfil) {
      setForm({
        nome_completo: perfil.nome_completo ?? "",
        nome_negocio: perfil.nome_negocio ?? "",
        tipo_negocio: perfil.tipo_negocio ?? "",
        volume_mensal: perfil.volume_mensal ?? "",
        cidade_estado: perfil.cidade_estado ?? "",
        whatsapp: perfil.whatsapp ?? "",
      });
    }
  }, [perfil]);

  async function handleSaveProfile() {
    try {
      await updatePerfil.mutateAsync({
        nome_completo: form.nome_completo || null,
        nome_negocio: form.nome_negocio || null,
        tipo_negocio: form.tipo_negocio || null,
        volume_mensal: form.volume_mensal || null,
        cidade_estado: form.cidade_estado || null,
        whatsapp: form.whatsapp || null,
      });
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar perfil.");
    }
  }

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

      {/* Account */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-primary" />
          <h2 className="font-semibold">Conta</h2>
        </div>
        {loadingMe ? <Skeleton className="h-12 w-full" /> : (
          <div className="text-sm">
            <span className="text-muted-foreground">E-mail: </span>
            <span className="font-medium" data-testid="text-user-email">{me?.email ?? user?.email ?? "—"}</span>
          </div>
        )}
      </div>

      {/* Editable Profile */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={18} className="text-primary" />
          <h2 className="font-semibold">Perfil do negócio</h2>
        </div>
        {loadingPerfil ? <Skeleton className="h-40 w-full" /> : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={form.nome_completo} onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))} placeholder="Seu nome" data-testid="input-config-nome" />
              </div>
              <div>
                <Label>Nome do negócio</Label>
                <Input value={form.nome_negocio} onChange={e => setForm(f => ({ ...f, nome_negocio: e.target.value }))} placeholder="Nome do seu negócio" data-testid="input-config-negocio" />
              </div>
              <div>
                <Label>Tipo de negócio</Label>
                <Input value={form.tipo_negocio} onChange={e => setForm(f => ({ ...f, tipo_negocio: e.target.value }))} placeholder="Ex: Marmitex, Bolos" data-testid="input-config-tipo" />
              </div>
              <div>
                <Label>Volume mensal</Label>
                <select
                  value={form.volume_mensal}
                  onChange={e => setForm(f => ({ ...f, volume_mensal: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  data-testid="input-config-volume"
                >
                  <option value="">—</option>
                  {VOLUME_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Cidade / Estado</Label>
                <Input value={form.cidade_estado} onChange={e => setForm(f => ({ ...f, cidade_estado: e.target.value }))} placeholder="Ex: São Paulo, SP" data-testid="input-config-cidade" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" data-testid="input-config-whatsapp" />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={updatePerfil.isPending} data-testid="button-save-profile">
              <Save size={16} className="mr-2" />
              {updatePerfil.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
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
