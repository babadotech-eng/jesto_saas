import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, CheckCircle2, ChevronRight, TrendingUp, ChefHat, Wallet } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <BarChart3 size={24} />
          </div>
          Precifica
        </div>
        <div className="flex items-center gap-4">
          <Link href="/planos" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden md:block">
            Preços
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
          <Link href="/cadastro">
            <Button>Começar Grátis</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Feito para empreendedores da alimentação
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Precifique com <br className="hidden md:block"/> 
              <span className="text-primary">confiança</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Assuma o controle do seu negócio de comida. Descubra o custo real das suas receitas, pare de perder dinheiro e venda com a margem certa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/cadastro">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14">
                  Começar Grátis <ChevronRight className="ml-2" />
                </Button>
              </Link>
              <Link href="/planos">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-background">
                  Ver Preços
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="relative rounded-2xl border border-border shadow-2xl overflow-hidden bg-card p-2 md:p-4 aspect-[4/3] transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
              <div className="w-full h-full rounded-xl border border-border/50 bg-background/50 flex flex-col p-6 shadow-inner">
                {/* Mockup UI */}
                <div className="flex justify-between items-center mb-6">
                  <div className="h-6 w-32 bg-primary/20 rounded-md"></div>
                  <div className="h-8 w-8 bg-muted rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Margem de Lucro</div>
                    <div className="text-2xl font-bold text-emerald-600">32.5%</div>
                  </div>
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Custo por Porção</div>
                    <div className="text-2xl font-bold">R$ 14,50</div>
                  </div>
                </div>
                <div className="flex-1 bg-card rounded-lg p-4 shadow-sm border border-border flex flex-col gap-3">
                  <div className="h-4 w-1/3 bg-muted rounded"></div>
                  <div className="flex-1 flex items-end gap-2 mt-4">
                    {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 rounded-t-md hover:bg-primary transition-colors" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 border-y border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-8">CONFIADO POR CENTENAS DE NEGÓCIOS DE ALIMENTAÇÃO</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale mix-blend-multiply">
              {/* Logos mock */}
              <div className="text-xl font-black font-serif italic">Doces da Maria</div>
              <div className="text-xl font-bold uppercase tracking-widest">Salgadinhos VIP</div>
              <div className="text-xl font-bold">MarmitaFit</div>
              <div className="text-xl font-semibold">Burger Artesanal</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Tudo que você precisa para lucrar mais</h2>
            <p className="text-lg text-muted-foreground">
              Abandone as planilhas complexas. O Precifica organiza seus custos e mostra exatamente onde está o seu lucro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <ChefHat size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Fichas Técnicas</h3>
              <p className="text-muted-foreground">
                Cadastre seus insumos e crie fichas técnicas precisas. Se o preço da farinha subir, o custo de todos os seus bolos é atualizado automaticamente.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Precificação Certa</h3>
              <p className="text-muted-foreground">
                Descubra o preço ideal de venda considerando custos variáveis, despesas fixas, taxas de aplicativos (iFood) e a margem de lucro desejada.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Controle Financeiro</h3>
              <p className="text-muted-foreground">
                Registre receitas e despesas, acompanhe seu fluxo de caixa e saiba qual é o seu ponto de equilíbrio mensal.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar py-12 px-6 text-sidebar-foreground/70">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-sidebar-foreground font-bold text-xl">
            <BarChart3 size={24} className="text-primary" />
            Precifica
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Precifica. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
