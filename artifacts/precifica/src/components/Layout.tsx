import { useAuth } from "@/contexts/AuthContext";
import { useAssinatura } from "@/hooks/useAssinatura";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Carrot,
  FileText,
  Wallet,
  ArrowRightLeft,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Lightbulb,
} from "lucide-react";
import { ReactNode } from "react";

const navigation = [
  { name: "Painel",          href: "/painel",         icon: LayoutDashboard },
  { name: "Produtos",        href: "/produtos",        icon: Package },
  { name: "Insumos",         href: "/insumos",         icon: Carrot },
  { name: "Fichas Técnicas", href: "/ficha-tecnica",   icon: FileText },
  { name: "Despesas",        href: "/despesas",        icon: Wallet },
  { name: "Lançamentos",     href: "/lancamentos",     icon: ArrowRightLeft },
  { name: "Funcionários",    href: "/funcionarios",    icon: Users, premium: true },
  { name: "Relatórios",      href: "/relatorios",      icon: BarChart3 },
  { name: "Configurações",   href: "/configuracoes",   icon: Settings },
];

const PC = {
  sidebar:       "#1a1625",
  sidebarActive: "#2d2540",
  sidebarText:   "#c4b8d8",
  sidebarBorder: "rgba(255,255,255,0.06)",
  accentLight:   "#a37ee8",
  primary:       "#7c5cbf",
};

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: assinatura } = useAssinatura();
  const isPremium = assinatura?.plano === "premium";
  const visibleNav = navigation.filter(item => !item.premium || isPremium);

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#f4f3f7" }}>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className="w-64 hidden md:flex flex-col"
        style={{ background: PC.sidebar, borderRight: `1px solid ${PC.sidebarBorder}` }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: `1px solid ${PC.sidebarBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7c5cbf, #a37ee8)" }}
            >
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Precifica</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
                style={{
                  background:  isActive ? PC.sidebarActive : "transparent",
                  color:       isActive ? "#fff"            : PC.sidebarText,
                  fontWeight:  isActive ? 600               : 400,
                  borderLeft:  isActive ? `3px solid ${PC.accentLight}` : "3px solid transparent",
                }}
              >
                <item.icon size={17} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Dica do dia */}
        <div className="mx-3 mb-3 rounded-xl p-4" style={{ background: "#2d2540", border: `1px solid ${PC.sidebarBorder}` }}>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: PC.primary }}>
              <Lightbulb size={13} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white mb-0.5">Dica do dia</p>
              <p className="text-[11px] leading-relaxed" style={{ color: PC.sidebarText }}>
                Produtos com margem abaixo de 20% merecem revisão de custo ou preço.
              </p>
              <a href="/relatorios" className="text-[11px] font-semibold mt-1.5 block" style={{ color: PC.accentLight }}>
                Saiba mais →
              </a>
            </div>
          </div>
        </div>

        {/* Sair */}
        <div className="px-3 pb-4" style={{ borderTop: `1px solid ${PC.sidebarBorder}`, paddingTop: "12px" }}>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all"
            style={{ color: PC.sidebarText }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PC.sidebarActive; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = PC.sidebarText; }}
          >
            <LogOut size={17} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="h-14 flex items-center px-5 md:hidden"
          style={{ background: PC.sidebar, borderBottom: `1px solid ${PC.sidebarBorder}` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: PC.primary }}>
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-white">Precifica</span>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ background: "#f4f3f7" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
