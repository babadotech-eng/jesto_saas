import { useAuth } from "@/contexts/AuthContext";
import { useGetAssinatura, useGetMe } from "@workspace/api-client-react";
import { usePerfil, useUpdatePerfil, PERFIL_QUERY_KEY } from "@/hooks/usePerfil";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, CreditCard, Settings, Save, Upload, ImageIcon, X, HeartCrack } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const VOLUME_OPTIONS = ["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 7.000", "R$ 7.000 a R$ 15.000", "Acima de R$ 15.000", "Ainda não vendo"];

function formatCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatPhone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Configuracoes() {
  const { signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: assinatura, isLoading: loadingAssinatura } = useGetAssinatura();
  const { data: me, isLoading: loadingMe } = useGetMe();
  const qc = useQueryClient();
  const { data: perfil, isLoading: loadingPerfil } = usePerfil();
  const updatePerfil = useUpdatePerfil();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isPendente = assinatura?.status === "pendente";
  const { data: pendingPayment } = useQuery<{ url: string | null }>({
    queryKey: ["assinatura", "pending-payment-url"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      const res = await fetch("/api/assinaturas/pending-payment-url", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { url: null };
      return res.json() as Promise<{ url: string | null }>;
    },
    enabled: isPendente,
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    nome_completo: "", nome_negocio: "", tipo_negocio: "",
    volume_mensal: "", cidade_estado: "", whatsapp: "", email: "", cpf_cnpj: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (perfil) {
      setForm({
        nome_completo: perfil.nome_completo ?? "",
        nome_negocio: perfil.nome_negocio ?? "",
        tipo_negocio: perfil.tipo_negocio ?? "",
        volume_mensal: perfil.volume_mensal ?? "",
        cidade_estado: perfil.cidade_estado ?? "",
        whatsapp: perfil.whatsapp ?? "",
        email: perfil.email ?? "",
        cpf_cnpj: perfil.cpf_cnpj ?? "",
      });
      setLogoPreview(perfil.logo_url ?? null);
    }
  }, [perfil]);

  async function handleSaveProfile() {
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Por favor, preencha um e-mail válido para continuar.");
      return;
    }
    if (form.whatsapp) {
      const digits = form.whatsapp.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) {
        toast.error("Por favor, preencha um telefone com DDD e número válido.");
        return;
      }
    }
    try {
      await updatePerfil.mutateAsync({
        nome_completo: form.nome_completo || null,
        nome_negocio: form.nome_negocio || null,
        tipo_negocio: form.tipo_negocio || null,
        volume_mensal: form.volume_mensal || null,
        cidade_estado: form.cidade_estado || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        cpf_cnpj: form.cpf_cnpj || null,
      });
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao salvar perfil.");
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2 MB.");
      return;
    }
    const userId = user?.id;
    if (!userId) { toast.error("Usuário não autenticado."); return; }

    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${userId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        const msg = uploadError.message ?? "";
        if (msg.includes("bucket") || msg.includes("not found") || msg.includes("Bucket")) {
          toast.error("Bucket 'logos' não encontrado. Crie-o seguindo as instruções ao final da página.");
        } else if (msg.includes("policy") || msg.includes("row-level") || msg.includes("security") || msg.includes("new row violates") || msg.includes("Unauthorized") || uploadError.statusCode === "403" || (uploadError as { status?: number }).status === 403) {
          toast.error("Permissão negada. Adicione a política de upload no Supabase (passo 5 das instruções).");
        } else {
          toast.error(`Erro no upload: ${msg || "tente novamente."}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      await updatePerfil.mutateAsync({ logo_url: publicUrl } as Parameters<typeof updatePerfil.mutateAsync>[0]);
      setLogoPreview(publicUrl);
      qc.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
      toast.success("Logo atualizado com sucesso!");
    } catch {
      toast.error("Erro ao fazer upload do logo.");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveLogo() {
    try {
      await updatePerfil.mutateAsync({ logo_url: null } as Parameters<typeof updatePerfil.mutateAsync>[0]);
      setLogoPreview(null);
      toast.success("Logo removido.");
    } catch {
      toast.error("Erro ao remover logo.");
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Você saiu com sucesso.");
    setLocation("/");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const res = await fetch("/api/conta", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentSession?.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao desativar conta");
      }
      toast.success("Conta desativada. Seus dados ficam preservados por até 3 meses.");
      await signOut();
      setLocation("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao desativar conta.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

      {/* Logo */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon size={18} className="text-primary" />
          <h2 className="font-semibold">Logo do negócio</h2>
        </div>
        {loadingPerfil ? <Skeleton className="h-20 w-full" /> : (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo do negócio" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                data-testid="button-upload-logo"
              >
                <Upload size={14} />
                {logoUploading ? "Enviando..." : logoPreview ? "Trocar logo" : "Enviar logo"}
              </Button>
              {logoPreview && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleRemoveLogo}>
                  <X size={14} />Remover
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG ou WebP · máx. 2 MB</p>
            </div>
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
                <Input
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: formatPhone(e.target.value) }))}
                  placeholder="(11) 99999-9999"
                  data-testid="input-config-whatsapp"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>E-mail de contato</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contato@seunegocio.com"
                  data-testid="input-config-email"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>CPF ou CNPJ</Label>
                <Input
                  inputMode="numeric"
                  value={form.cpf_cnpj}
                  onChange={e => setForm(f => ({ ...f, cpf_cnpj: formatCpfCnpj(e.target.value) }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  data-testid="input-config-cpf-cnpj"
                />
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={planColor} data-testid="badge-plano">{planLabel}</Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">Ativo</Badge>
              </div>
              {isPendente && (
                <p className="text-sm text-amber-600 font-medium mt-1">Esperando pagamento</p>
              )}
              {assinatura.valido_ate && (
                <p className="text-sm text-muted-foreground mt-1">Válido até: {new Date(assinatura.valido_ate).toLocaleDateString("pt-BR")}</p>
              )}
              {assinatura.desconto_aplicado != null && (
                <p className="text-sm text-green-600 mt-1">
                  Desconto aplicado: {assinatura.tipo_desconto === "percentual"
                    ? `${assinatura.desconto_aplicado}%`
                    : `R$ ${assinatura.desconto_aplicado.toFixed(2)}`}
                </p>
              )}
              {assinatura.plano === "gratis" && (
                <p className="text-sm text-muted-foreground mt-1">Limite: 1 receita cadastrada</p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              {isPendente && pendingPayment?.url && (
                <Button size="sm" asChild>
                  <a href={pendingPayment.url} target="_blank" rel="noopener noreferrer">Efetuar Pagamento</a>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <a href="/planos">Fazer Upgrade</a>
              </Button>
            </div>
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

      {/* Zona de Risco */}
      <div className="bg-card border border-destructive/20 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-destructive">Desativar conta</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Seus dados ficam preservados por até 3 meses e podem ser restaurados pelo suporte
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <HeartCrack size={16} className="mr-2" />
            Deletar conta
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <HeartCrack size={20} />
              Desativar sua conta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Ao confirmar, sua conta será <strong className="text-foreground">desativada imediatamente</strong> e você será desconectado.</p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span>Seus dados ficam <strong className="text-foreground">preservados por até 3 meses</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span>A conta fica <strong className="text-foreground">inacessível</strong> durante esse período</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                    <span>Após 3 meses, os dados podem ser <strong className="text-foreground">excluídos definitivamente</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    <span>Ao restaurar <strong className="text-foreground">sem assinatura ativa</strong>, você entra no plano Grátis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    <span>Ao restaurar <strong className="text-foreground">com assinatura ativa</strong>, retorna no plano correspondente</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground/70 border-t border-border pt-2">
                  Para restaurar a conta antes do prazo, entre em contato com o suporte.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? "Desativando..." : "Sim, desativar minha conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
