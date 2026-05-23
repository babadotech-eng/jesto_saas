import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, X, ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function Planos() {
  const [anual, setAnual] = useState(false);

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-12">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Home
        </Link>
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-foreground">Preços simples para pequenos negócios</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Escolha o plano ideal para a sua operação. Sem surpresas.
          </p>
          
          <div className="inline-flex items-center bg-card border border-border p-1 rounded-xl shadow-sm">
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${!anual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setAnual(false)}
            >
              Mensal
            </button>
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${anual ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setAnual(true)}
            >
              Anual <span className="ml-1 text-xs opacity-80">(Economize 15%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Grátis */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Grátis</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">Para quem está começando a testar receitas.</p>
            <div className="mb-6">
              <span className="text-4xl font-black">R$ 0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Link href="/cadastro" className="w-full mb-8">
              <Button variant="outline" className="w-full">Começar Grátis</Button>
            </Link>
            <div className="space-y-4 flex-1">
              <Feature text="Até 10 Fichas Técnicas" />
              <Feature text="Até 30 Insumos" />
              <Feature text="Cálculo de CMV" />
              <Feature text="Sem controle de despesas" missing />
              <Feature text="Sem fluxo de caixa" missing />
            </div>
          </div>

          {/* Pro */}
          <div className="bg-card rounded-2xl border-2 border-primary p-8 shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-sm">
              Mais Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-primary">Pro</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">Para o negócio que quer controle real.</p>
            <div className="mb-6">
              <span className="text-4xl font-black">R$ {anual ? '199,00' : '19,90'}</span>
              <span className="text-muted-foreground">{anual ? '/ano' : '/mês'}</span>
            </div>
            <Link href="/cadastro" className="w-full mb-8">
              <Button className="w-full">Assinar Pro</Button>
            </Link>
            <div className="space-y-4 flex-1">
              <Feature text="Fichas Técnicas Ilimitadas" />
              <Feature text="Insumos Ilimitados" />
              <Feature text="Cálculo de Margem Real" />
              <Feature text="Dashboard de Custos" />
              <Feature text="Alertas de Margem Baixa" />
            </div>
          </div>

          {/* Premium */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-muted-foreground text-sm mb-6 h-10">Gestão financeira completa de ponta a ponta.</p>
            <div className="mb-6">
              <span className="text-4xl font-black">R$ {anual ? '399,00' : '39,90'}</span>
              <span className="text-muted-foreground">{anual ? '/ano' : '/mês'}</span>
            </div>
            <Link href="/cadastro" className="w-full mb-8">
              <Button variant="outline" className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar/90 hover:text-sidebar-foreground border-transparent">Assinar Premium</Button>
            </Link>
            <div className="space-y-4 flex-1">
              <Feature text="Tudo do plano Pro" />
              <Feature text="Gestão de Despesas Fixas" />
              <Feature text="Fluxo de Caixa (Lançamentos)" />
              <Feature text="Cálculo de Ponto de Equilíbrio" />
              <Feature text="Relatórios Avançados" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, missing = false }: { text: string, missing?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {missing ? (
        <X size={18} className="text-muted-foreground/50 mt-0.5 shrink-0" />
      ) : (
        <Check size={18} className="text-primary mt-0.5 shrink-0" />
      )}
      <span className={`text-sm ${missing ? 'text-muted-foreground/60 line-through' : 'text-foreground'}`}>
        {text}
      </span>
    </div>
  );
}
