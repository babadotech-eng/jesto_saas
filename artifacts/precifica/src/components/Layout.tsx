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
  { name: "Dashboard",       href: "/painel",         icon: LayoutDashboard },
  { name: "Produtos",        href: "/produtos",        icon: Package },
  { name: "Ingredientes",    href: "/insumos",         icon: Carrot },
  { name: "Receitas",        href: "/ficha-tecnica",   icon: FileText },
  { name: "Despesas",        href: "/despesas",        icon: Wallet },
  { name: "Transações",      href: "/lancamentos",     icon: ArrowRightLeft },
  { name: "Funcionários",    href: "/funcionarios",    icon: Users, premium: true },
  { name: "Relatórios",      href: "/relatorios",      icon: BarChart3 },
  { name: "Configurações",   href: "/configuracoes",   icon: Settings },
];

const SB = {
  bg:         "#1a1625",
  activeBg:   "rgba(255,255,255,0.10)",
  text:       "#a89cc4",
  textActive: "#ffffff",
  divider:    "rgba(255,255,255,0.07)",
};

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: assinatura } = useAssinatura();
  const isPremium = assinatura?.plano === "premium";
  const visibleNav = navigation.filter(item => !item.premium || isPremium);

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#f4f3f7" }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-56 hidden md:flex flex-col shrink-0"
        style={{ background: SB.bg }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: `1px solid ${SB.divider}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7c5cbf, #a37ee8)" }}
            >
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-base text-white tracking-tight">Precifica</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive ? SB.activeBg : "transparent",
                  color:      isActive ? SB.textActive : SB.text,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <item.icon size={16} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Dica do dia */}
        <div className="mx-3 mb-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${SB.divider}` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(124,92,191,0.4)" }}>
              <Lightbulb size={12} style={{ color: "#c4b0f0" }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: "#c4b0f0" }}>Dica do dia</p>
          </div>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: SB.text }}>
            Atualize o custo dos seus ingredientes regularmente.
          </p>
          <Link href="/insumos" className="text-[11px] font-semibold hover:underline" style={{ color: "#a37ee8" }}>
            Saiba mais →
          </Link>
        </div>

        {/* Sair */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid ${SB.divider}` }}>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all text-left"
            style={{ color: SB.text }}
          >
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header
          className="h-14 flex items-center px-5 md:hidden"
          style={{ background: SB.bg }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c5cbf, #a37ee8)" }}>
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-white text-sm">Precifica</span>
          </div>
        </header>
        <div className="flex-1 p-5 overflow-y-auto" style={{ background: "#f4f3f7" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
