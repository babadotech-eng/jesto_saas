import { useAuth } from "@/contexts/AuthContext";
import { useGetAssinatura, useGetMe } from "@workspace/api-client-react";
import { usePerfil, useUpdatePerfil } from "@/hooks/usePerfil";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User, CreditCard, Settings, Save, Upload, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

const VOLUME_OPTIONS = ["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 7.000", "R$ 7.000 a R$ 15.000", "Acima de R$ 15.000", "Ainda não vendo"];

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
  const { data: perfil, isLoading: loadingPerfil } = usePerfil();
  const updatePerfil = useUpdatePerfil();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome_completo: "", nome_negocio: "", tipo_negocio: "",
    volume_mensal: "", cidade_estado: "", whatsapp: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
      setLogoPreview(perfil.logo_url ?? null);
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
        if (uploadError.message?.includes("bucket") || uploadError.message?.includes("not found")) {
          toast.error("Bucket de logos não encontrado. Veja as instruções ao final da página.");
        } else {
          toast.error(`Erro no upload: ${uploadError.message}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await updatePerfil.mutateAsync({ logo_url: publicUrl } as Parameters<typeof updatePerfil.mutateAsync>[0]);
      setLogoPreview(publicUrl);
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
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo do negócio" className="w-full h-full object-contain" />
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

      {/* Bucket setup instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900" data-testid="bucket-instructions">
        <p className="font-semibold mb-2">Como configurar o upload de logo</p>
        <ol className="list-decimal list-inside space-y-1 text-amber-800">
          <li>Acesse o painel do Supabase do seu projeto</li>
          <li>Vá em <strong>Storage</strong> → <strong>Buckets</strong> → <strong>New bucket</strong></li>
          <li>Nome do bucket: <code className="bg-amber-100 px-1 rounded font-mono">logos</code></li>
          <li>Marque <strong>Public bucket</strong> (para que as imagens sejam exibidas sem autenticação)</li>
          <li>Clique em <strong>Save</strong></li>
        </ol>
        <p className="mt-2 text-xs text-amber-700">Feito isso, o botão "Enviar logo" acima funcionará normalmente.</p>
      </div>
    </div>
  );
}
