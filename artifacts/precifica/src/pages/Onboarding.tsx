import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdatePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight, Check, HelpCircle } from "lucide-react";
import logoOnboarding from "@assets/logo-onboarding_1780572611823.png";

// ─── CPF / CNPJ helpers ────────────────────────────────────────────────────

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

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== +d[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === +d[10];
}

function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (digits: string, weights: number[]) => {
    let s = 0;
    for (let i = 0; i < weights.length; i++) s += +digits[i] * weights[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const r1 = calc(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (r1 !== +d[12]) return false;
  const r2 = calc(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return r2 === +d[13];
}

function validateCpfCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "CPF ou CNPJ é obrigatório";
  if (digits.length === 11) {
    return validateCPF(value) ? null : "CPF inválido. Verifique os números.";
  }
  if (digits.length === 14) {
    return validateCNPJ(value) ? null : "CNPJ inválido. Verifique os números.";
  }
  return "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido";
}

// ─── Step definitions ──────────────────────────────────────────────────────

type FieldKey =
  | "nome_completo"
  | "cpf_cnpj"
  | "nome_negocio"
  | "tipo_negocio"
  | "volume_mensal"
  | "cidade_estado"
  | "whatsapp"
  | "origem";

type StepDef = {
  field: FieldKey;
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "tel" | "select" | "cpf_cnpj";
  options?: readonly string[];
};

const STEPS: readonly StepDef[] = [
  { field: "nome_completo",  label: "Qual é o seu nome?",                      placeholder: "Seu nome completo",             required: true,  type: "text" },
  { field: "cpf_cnpj",      label: "CPF ou CNPJ",                             placeholder: "000.000.000-00",                required: true,  type: "cpf_cnpj" },
  { field: "nome_negocio",  label: "Qual é o nome do seu negócio?",            placeholder: "Ex: Marmitas da Ana",            required: true,  type: "text" },
  { field: "tipo_negocio",  label: "Qual tipo de negócio você tem?",           placeholder: "Ex: Marmitex, Bolos, Salgados…",required: true,  type: "text" },
  { field: "volume_mensal", label: "Quanto você vende por mês, em média?",     placeholder: "",                              required: false, type: "select",
    options: ["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 7.000", "R$ 7.000 a R$ 15.000", "Acima de R$ 15.000", "Ainda não vendo"] },
  { field: "cidade_estado", label: "Qual é a sua cidade e estado?",            placeholder: "Ex: São Paulo, SP",             required: false, type: "text" },
  { field: "whatsapp",      label: "Qual é o seu WhatsApp?",                   placeholder: "Ex: (11) 99999-9999",           required: false, type: "tel" },
  { field: "origem",        label: "Como você ficou sabendo do Jesto?",        placeholder: "",                              required: false, type: "select",
    options: ["Instagram", "Facebook", "TikTok", "Google", "Indicação de amigo", "YouTube", "Outro"] },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    nome_completo: "", cpf_cnpj: "", nome_negocio: "", tipo_negocio: "",
    volume_mensal: "", cidade_estado: "", whatsapp: "", origem: "",
  });
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setLocation] = useLocation();
  const updatePerfil = useUpdatePerfil();

  function formatPhone(v: string): string {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const progress = (step / STEPS.length) * 100;

  function setValue(val: string) {
    setFieldError(null);
    setValues(v => ({ ...v, [current.field]: val }));
  }

  async function handleNext() {
    if (current.type === "cpf_cnpj") {
      const err = validateCpfCnpj(values.cpf_cnpj);
      if (err) { setFieldError(err); return; }
    } else if (current.required && !values[current.field].trim()) {
      setFieldError("Este campo é obrigatório");
      return;
    }
    setFieldError(null);
    if (!isLast) { setStep(s => s + 1); return; }

    setSaving(true);
    try {
      await updatePerfil.mutateAsync({
        nome_completo:  values.nome_completo  || null,
        cpf_cnpj:       values.cpf_cnpj       || null,
        nome_negocio:   values.nome_negocio   || null,
        tipo_negocio:   values.tipo_negocio   || null,
        volume_mensal:  values.volume_mensal  || null,
        cidade_estado:  values.cidade_estado  || null,
        whatsapp:       values.whatsapp       || null,
        origem:         values.origem         || null,
      });
      toast.success("Tudo pronto! Bem-vindo ao Jesto.");
      setLocation("/painel");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleNext();
  }

  // App palette
  const accent = "#1A1A1A";
  const accentHover = "#2d2d2d";
  const badge = "#4B2B69";

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex flex-col">
      {/* Top progress bar */}
      <div className="h-1 bg-zinc-200 fixed top-0 left-0 right-0 z-50">
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: accent }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 p-6">
        <img src={logoOnboarding} alt="Jesto" className="h-18 w-auto rounded-lg" />
        <span className="ml-auto text-sm text-zinc-400">{step + 1} / {STEPS.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-lg">

          {/* Step dots */}
          <div className="flex gap-1.5 mb-10">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: i <= step ? accent : "#e4e4e7" }} />
            ))}
          </div>

          {/* Label */}
          <div className="mb-8">
            {current.required && (
              <span className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                style={{ color: badge }}>
                Obrigatório
              </span>
            )}

            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight">
                {current.label}
              </h1>

              {/* Help icon for cpf_cnpj step */}
              {current.type === "cpf_cnpj" && (
                <div className="relative mt-1">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(v => !v)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    aria-label="Mais informações"
                  >
                    <HelpCircle size={20} />
                  </button>
                  {showTooltip && (
                    <div className="absolute left-0 top-7 z-50 w-64 rounded-xl px-4 py-3 text-sm shadow-lg"
                      style={{ background: "#1A1A1A", color: "#F5F4F1", lineHeight: 1.5 }}>
                      Esse dado é necessário para liberar cobranças e assinaturas com segurança.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          {current.type === "select" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-8">
              {current.options!.map(opt => (
                <button key={opt} onClick={() => setValue(opt)}
                  className="p-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
                  style={values[current.field] === opt
                    ? { borderColor: accent, background: "#f5f5f0", color: accent }
                    : { borderColor: "#e4e4e7", background: "#fff", color: "#3f3f46" }}>
                  {values[current.field] === opt && <Check size={12} className="inline mr-1" style={{ color: accent }} />}
                  {opt}
                </button>
              ))}
            </div>
          ) : current.type === "cpf_cnpj" ? (
            <div className="mb-2">
              <Input
                type="text"
                inputMode="numeric"
                value={values.cpf_cnpj}
                onChange={e => setValue(formatCpfCnpj(e.target.value))}
                onKeyDown={handleKeyDown}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                autoFocus
                className="h-14 text-xl border-0 border-b-2 border-zinc-300 rounded-none bg-transparent px-0 focus-visible:ring-0 transition-colors placeholder:text-zinc-300"
                style={{ borderBottomColor: fieldError ? "#dc2626" : undefined }}
              />
              {fieldError && (
                <p className="mt-2 text-sm" style={{ color: "#dc2626" }}>{fieldError}</p>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <Input
                type={current.type}
                value={values[current.field]}
                onChange={e => setValue(current.field === "whatsapp" ? formatPhone(e.target.value) : e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={current.placeholder}
                autoFocus
                className="h-14 text-xl border-0 border-b-2 border-zinc-300 rounded-none bg-transparent px-0 focus-visible:ring-0 transition-colors placeholder:text-zinc-300"
              />
              {fieldError && (
                <p className="mt-2 text-sm" style={{ color: "#dc2626" }}>{fieldError}</p>
              )}
            </div>
          )}

          {/* Spacer for select steps */}
          {current.type === "select" && <div className="mb-8" />}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleNext}
              disabled={saving}
              size="lg"
              className="font-bold px-8 rounded-xl h-12 shadow-md text-white"
              style={{ background: accent }}
              onMouseEnter={e => (e.currentTarget.style.background = accentHover)}
              onMouseLeave={e => (e.currentTarget.style.background = accent)}
            >
              {saving ? "Salvando..." : isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight size={18} className="ml-1" />}
            </Button>

            {!current.required && (
              <button
                onClick={() => { setFieldError(null); isLast ? handleNext() : setStep(s => s + 1); }}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Pular
              </button>
            )}

            {step > 0 && (
              <button
                onClick={() => { setFieldError(null); setStep(s => s - 1); }}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors ml-auto"
              >
                Voltar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
