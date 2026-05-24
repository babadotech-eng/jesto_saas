import { useAuth } from "@/contexts/AuthContext";
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
  LogOut
} from "lucide-react";
import { ReactNode } from "react";

const navigation = [
  { name: "Painel", href: "/painel", icon: LayoutDashboard },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Insumos", href: "/insumos", icon: Carrot },
  { name: "Fichas Técnicas", href: "/ficha-tecnica", icon: FileText },
  { name: "Despesas", href: "/despesas", icon: Wallet },
  { name: "Lançamentos", href: "/lancamentos", icon: ArrowRightLeft },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-100 via-slate-50 to-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] text-white border-r border-zinc-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xl">
            <span className="bg-amber-400 text-zinc-900 p-1 rounded-md">
              <BarChart3 size={20} />
            </span>
            Precifica
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-zinc-700 text-white font-medium" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white w-full transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-8 md:hidden shadow-sm">
           <div className="font-bold text-lg text-amber-500">Precifica</div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-100 via-slate-50 to-gray-200">
          {children}
        </div>
      </main>
    </div>
  );
}
