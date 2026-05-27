import { useLocation } from "wouter";
import { LayoutDashboard, Users, CreditCard, TrendingUp, Tag, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminAssinaturas from "./AdminAssinaturas";
import AdminFinanceiro from "./AdminFinanceiro";
import AdminCodigos from "./AdminCodigos";

const NAV_ITEMS = [
  { id: "visao-geral",   label: "Visão Geral",  path: "/admin",              icon: LayoutDashboard },
  { id: "usuarios",      label: "Usuários",      path: "/admin/usuarios",     icon: Users },
  { id: "assinaturas",   label: "Assinaturas",   path: "/admin/assinaturas",  icon: CreditCard },
  { id: "financeiro",    label: "Financeiro",    path: "/admin/financeiro",   icon: TrendingUp },
  { id: "codigos",       label: "Cupons Promo",  path: "/admin/codigos",      icon: Tag },
];

function getActiveTab(location: string): string {
  if (location === "/admin/usuarios")    return "usuarios";
  if (location === "/admin/assinaturas") return "assinaturas";
  if (location === "/admin/financeiro")  return "financeiro";
  if (location === "/admin/codigos")     return "codigos";
  return "visao-geral";
}

export default function AdminPanel() {
  const [location, setLocation] = useLocation();
  const { signOut, user } = useAuth();
  const activeTab = getActiveTab(location);

  async function handleSignOut() {
    await signOut();
    setLocation("/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-zinc-950 text-zinc-100 flex flex-col border-r border-zinc-800">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-white">Precifica</p>
              <p className="text-xs text-zinc-400 leading-tight">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, path, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setLocation(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-amber-500 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-3">
          <div className="px-3">
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={handleSignOut}
          >
            <LogOut size={14} />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-foreground">
            {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? "Admin"}
          </h1>
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
            Acesso Administrativo
          </span>
        </header>

        {/* Content */}
        {activeTab === "visao-geral"  && <AdminOverview />}
        {activeTab === "usuarios"     && <AdminUsers />}
        {activeTab === "assinaturas"  && <AdminAssinaturas />}
        {activeTab === "financeiro"   && <AdminFinanceiro />}
        {activeTab === "codigos"      && <AdminCodigos />}
      </main>
    </div>
  );
}
