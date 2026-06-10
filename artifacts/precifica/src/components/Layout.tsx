import { useAuth } from "@/contexts/AuthContext";
import { useAssinatura } from "@/hooks/useAssinatura";
import { planAtLeast } from "@/lib/planConfig";
import { getDicaDoDia } from "@/data/dicas";
import { Link, useLocation } from "wouter";
import LegalFooter from "@/components/LegalFooter";
import {
  LayoutDashboard, Package, Carrot, FileText,
  Wallet, ArrowRightLeft, BarChart3, Settings, // BarChart3 used for Relatórios nav icon
  Users, LogOut, Lightbulb, ArrowRight, Menu, X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import logoPainel from "@assets/logo-painel2_1780572910832.png";

const navigation = [
  { name: "Painel",        href: "/painel",       icon: LayoutDashboard },
  { name: "Produtos",      href: "/produtos",      icon: Package },
  { name: "Ingredientes",  href: "/insumos",       icon: Carrot },
  { name: "Ficha Técnica", href: "/ficha-tecnica", icon: FileText },
  { name: "Lançamentos",   href: "/lancamentos",   icon: ArrowRightLeft,  minPlan: "premium" as const },
  { name: "Funcionários",  href: "/funcionarios",  icon: Users,           minPlan: "premium" as const },
  { name: "Relatórios",    href: "/relatorios",    icon: BarChart3,       minPlan: "pro" as const },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

function SidebarContent({
  visibleNav,
  location,
  signOut,
  onNavClick,
}: {
  visibleNav: typeof navigation;
  location: string;
  signOut: () => void;
  onNavClick?: () => void;
}) {
  const d = getDicaDoDia();
  const [, navigate] = useLocation();
  return (
    <>
      {/* Logo */}
      <div className="h-auto min-h-16 py-1.5 flex items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col items-start justify-center">
          <img src={logoPainel} alt="Jesto" className="h-11 w-auto rounded-lg shrink-0" />
          <span className="text-white text-[10px] leading-none mt-0.5 tracking-wide">Gestão de um jeito certo</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {visibleNav.map(item => {
          const active = location === item.href;
          return (
            <Link key={item.name} href={item.href}
              onClick={onNavClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: active ? "#7A4FB2" : "transparent",
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
      <div className="mx-3 mb-3 rounded-2xl p-4 shrink-0"
        style={{ background: "#232338", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} style={{ color: "#F2B544", flexShrink: 0 }} />
          <p className="text-xs font-semibold text-white">Dica do dia</p>
        </div>
        <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "#CFC9DA" }}>
          {d.texto}
        </p>
        <Link href={d.linkPath}
          onClick={onNavClick}
          className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
          style={{ color: "#E6DDF4" }}>
          {d.linkLabel} <ArrowRight size={10} />
        </Link>
      </div>

      {/* Sair */}
      <div className="px-3 pt-2 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={async () => { onNavClick?.(); await signOut(); navigate("/"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all hover:bg-white/5 active:bg-white/10 active:scale-[0.98]"
          style={{ color: "#D9D2E3" }}>
          <LogOut size={16} style={{ color: "#C7BED6" }} />
          <span className="text-sm">Sair</span>
        </button>
      </div>

    </>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { data: assinatura } = useAssinatura();
  const plano = assinatura?.planoEfetivo ?? "gratis";
  const visibleNav = navigation.filter(i => !i.minPlan || planAtLeast(plano, i.minPlan));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* ── Sidebar (desktop) ────────────────────────────────── */}
      <aside className="w-56 hidden md:flex flex-col shrink-0"
        style={{ background: "#161722" }}>
        <SidebarContent
          visibleNav={visibleNav}
          location={location}
          signOut={signOut}
        />
      </aside>

      {/* ── Mobile drawer overlay ─────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer */}
          <aside className="relative flex flex-col w-64 overflow-y-auto"
            style={{ background: "#161722" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg"
              style={{ color: "#D9D2E3" }}
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            <SidebarContent
              visibleNav={visibleNav}
              location={location}
              signOut={signOut}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-auto min-h-14 py-1.5 flex items-center justify-between px-5 md:hidden shrink-0"
          style={{ background: "#161722", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col items-start justify-center">
            <img src={logoPainel} alt="Jesto" className="h-11 w-auto rounded-lg" />
            <span className="text-white text-[10px] leading-none mt-0.5 tracking-wide">Gestão de um jeito certo</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg"
            style={{ color: "#D9D2E3" }}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </header>

        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-background inner-pages">
          {children}
        </div>
      </main>
    </div>
  );
}
