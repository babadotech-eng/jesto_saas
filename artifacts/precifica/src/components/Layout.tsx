import { useAuth } from "@/contexts/AuthContext";
import { useAssinatura } from "@/hooks/useAssinatura";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, Carrot, FileText,
  Wallet, ArrowRightLeft, BarChart3, Settings,
  Users, LogOut, Lightbulb,
} from "lucide-react";
import { ReactNode } from "react";

const navigation = [
  { name: "Dashboard",     href: "/painel",       icon: LayoutDashboard },
  { name: "Produtos",      href: "/produtos",      icon: Package },
  { name: "Ingredientes",  href: "/insumos",       icon: Carrot },
  { name: "Receitas",      href: "/ficha-tecnica", icon: FileText },
  { name: "Despesas",      href: "/despesas",      icon: Wallet },
  { name: "Transações",    href: "/lancamentos",   icon: ArrowRightLeft },
  { name: "Funcionários",  href: "/funcionarios",  icon: Users, premium: true },
  { name: "Relatórios",    href: "/relatorios",    icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: assinatura } = useAssinatura();
  const isPremium = assinatura?.plano === "premium";
  const visibleNav = navigation.filter(i => !i.premium || isPremium);

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#F5F2ED" }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-56 hidden md:flex flex-col shrink-0"
        style={{ background: "#161722" }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #6E4B97, #8D74B3)" }}>
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-base text-white tracking-tight">Precifica</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {visibleNav.map(item => {
            const active = location === item.href;
            return (
              <Link key={item.name} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: active ? "#6E4B97" : "transparent",
                  color:      active ? "#FFFFFF"  : "#D9D2E3",
                  fontWeight: active ? 600         : 400,
                }}>
                <item.icon size={16} style={{ color: active ? "#FFFFFF" : "#C7BED6" }} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Dica do dia */}
        <div className="mx-3 mb-3 rounded-2xl p-4"
          style={{ background: "#232338", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} style={{ color: "#F2B544", flexShrink: 0 }} />
            <p className="text-xs font-semibold text-white">Dica do dia</p>
          </div>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "#CFC9DA" }}>
            Atualize o custo dos seus ingredientes regularmente.
          </p>
          <Link href="/insumos"
            className="text-[11px] font-semibold hover:underline"
            style={{ color: "#E6DDF4" }}>
            Saiba mais →
          </Link>
        </div>

        {/* Sair */}
        <div className="px-3 pb-4 pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all"
            style={{ color: "#D9D2E3" }}>
            <LogOut size={16} style={{ color: "#C7BED6" }} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-14 flex items-center px-5 md:hidden"
          style={{ background: "#161722", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6E4B97,#8D74B3)" }}>
              <span className="text-white font-black text-xs">P</span>
            </div>
            <span className="font-bold text-white text-sm">Precifica</span>
          </div>
        </header>

        <div className="flex-1 p-5 overflow-y-auto" style={{ background: "#F5F2ED" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
