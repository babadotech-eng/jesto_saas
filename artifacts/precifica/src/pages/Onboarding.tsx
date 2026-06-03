import { useState } from "react";
import { useLocation } from "wouter";
import { useUpdatePerfil } from "@/hooks/usePerfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronRight, Check } from "lucide-react";
import iconjestoBlack from "@assets/iconjesto_black_1780519861187.png";

type StepDef = {
  field: "nome_completo" | "nome_negocio" | "tipo_negocio" | "volume_mensal" | "cidade_estado" | "whatsapp" | "origem";
  label: string;
  placeholder: string;
  required: boolean;
  type: "text" | "tel" | "select";
  options?: readonly string[];
};

const STEPS: readonly StepDef[] = [
  { field: "nome_completo", label: "Qual é o seu nome?", placeholder: "Seu nome completo", required: true, type: "text" },
  { field: "nome_negocio", label: "Qual é o nome do seu negócio?", placeholder: "Ex: Marmitas da Ana", required: true, type: "text" },
  { field: "tipo_negocio", label: "Qual tipo de negócio você tem?", placeholder: "Ex: Marmitex, Bolos, Salgados, Doces...", required: true, type: "text" },
  { field: "volume_mensal", label: "Quanto você vende por mês, em média?", placeholder: "", required: false, type: "select",
    options: ["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 7.000", "R$ 7.000 a R$ 15.000", "Acima de R$ 15.000", "Ainda não vendo"] },
  { field: "cidade_estado", label: "Qual é a sua cidade e estado?", placeholder: "Ex: São Paulo, SP", required: false, type: "text" },
  { field: "whatsapp", label: "Qual é o seu WhatsApp?", placeholder: "Ex: (11) 99999-9999", required: false, type: "tel" },
  { field: "origem", label: "Como você ficou sabendo do Jesto?", placeholder: "", required: false, type: "select",
    options: ["Instagram", "Facebook", "TikTok", "Google", "Indicação de amigo", "YouTube", "Outro"] },
] as const;

type FieldKey = typeof STEPS[number]["field"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    nome_completo: "", nome_negocio: "", tipo_negocio: "", volume_mensal: "",
    cidade_estado: "", whatsapp: "", origem: "",
  });
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

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = (step / STEPS.length) * 100;

  function setValue(val: string) {
    setValues(v => ({ ...v, [current.field]: val }));
  }

  async function handleNext() {
    if (current.required && !values[current.field].trim()) {
      toast.error("Este campo é obrigatório");
      return;
    }
    if (!isLast) {
      setStep(s => s + 1);
      return;
    }
    setSaving(true);
    try {
      await updatePerfil.mutateAsync({
        nome_completo: values.nome_completo || null,
        nome_negocio: values.nome_negocio || null,
        tipo_negocio: values.tipo_negocio || null,
        volume_mensal: values.volume_mensal || null,
        cidade_estado: values.cidade_estado || null,
        whatsapp: values.whatsapp || null,
        origem: values.origem || null,
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

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex flex-col">
      <div className="h-1 bg-zinc-200 fixed top-0 left-0 right-0 z-50">
        <div className="h-full bg-[#FF6C3A] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-2 p-6">
        <img src={iconjestoBlack} alt="Jesto" className="w-9 h-9 rounded-lg" />
        <span className="font-bold text-zinc-800">Jesto</span>
        <span className="ml-auto text-sm text-zinc-400">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-full max-w-lg">
          <div className="flex gap-1.5 mb-10">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-[#FF6C3A]" : "bg-zinc-200"}`} />
            ))}
          </div>

          <div className="mb-8">
            {current.required && (
              <span className="text-xs font-semibold text-[#FF6C3A] uppercase tracking-widest mb-2 block">
                Obrigatório
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight mb-2">
              {current.label}
            </h1>
          </div>

          {current.type === "select" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-8">
              {current.options!.map(opt => (
                <button
                  key={opt}
                  onClick={() => setValue(opt)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                    values[current.field] === opt
                      ? "border-[#FF6C3A] bg-orange-50 text-[#FF6C3A]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {values[current.field] === opt && <Check size={12} className="inline mr-1 text-[#FF6C3A]" />}
                  {opt}
                </button>
              ))}
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
                className="h-14 text-xl border-0 border-b-2 border-zinc-300 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-[#FF6C3A] transition-colors placeholder:text-zinc-300"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={handleNext}
              disabled={saving}
              size="lg"
              className="bg-[#FF6C3A] hover:bg-[#E8542A] active:bg-[#D43D15] text-white font-bold px-8 rounded-xl h-12 shadow-lg shadow-orange-200"
            >
              {saving ? "Salvando..." : isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight size={18} className="ml-1" />}
            </Button>

            {!current.required && (
              <button
                onClick={() => isLast ? handleNext() : setStep(s => s + 1)}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Pular
              </button>
            )}

            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
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
