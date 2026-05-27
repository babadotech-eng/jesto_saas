import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, CreditCard, UserPlus, Crown, Star, User2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch, type AdminStats } from "@/lib/adminFetch";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}

function planoBadge(plano: string) {
  const map: Record<string, string> = {
    premium: "bg-amber-100 text-amber-800 border-amber-200",
    pro: "bg-blue-100 text-blue-800 border-blue-200",
    gratis: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels: Record<string, string> = { premium: "Premium", pro: "Pro", gratis: "Grátis" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[plano] ?? map.gratis}`}>
      {labels[plano] ?? plano}
    </span>
  );
}

export default function AdminOverview() {
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/stats");
      if (!res.ok) throw new Error("Erro ao buscar estatísticas");
      return res.json();
    },
    staleTime: 30_000,
  });

  const cards = [
    {
      label: "Total de Usuários",
      value: data?.totalUsuarios ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Plano Grátis",
      value: data?.porPlano.gratis ?? 0,
      icon: User2,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: "Plano Pro",
      value: data?.porPlano.pro ?? 0,
      icon: Star,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Plano Premium",
      value: data?.porPlano.premium ?? 0,
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Assinaturas Ativas",
      value: data?.assinaturasAtivas ?? 0,
      icon: CreditCard,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Novos este Mês",
      value: data?.novosMes ?? 0,
      icon: UserPlus,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground mt-1">Resumo da plataforma em tempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{label}</p>
              {isLoading
                ? <Skeleton className="h-7 w-12 mt-1" />
                : <p className="text-2xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
              }
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-amber-500" />
          <h3 className="font-semibold text-foreground">Atividade Recente</h3>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : !data?.atividades.length ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade de assinatura registrada ainda.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Atualizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.atividades.map((a) => (
                  <tr key={a.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[200px]">{a.nomeCompleto ?? a.email ?? a.userId}</p>
                      {a.nomeCompleto && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{a.email}</p>}
                    </td>
                    <td className="px-4 py-3">{planoBadge(a.plano)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs ${a.status === "ativo" ? "text-green-600" : "text-red-500"}`}>
                        {a.status === "ativo" ? "Ativo" : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmtDate(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
