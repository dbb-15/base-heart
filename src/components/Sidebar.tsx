// Sidebar com itens filtrados por RBAC.
import {
  Home,
  Building2,
  Users,
  BarChart3,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Settings,
  Shield,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../types";
import { NAV_LABEL } from "../labels";
import { useHashRoute } from "../hooks/useHashRoute";
import { useSession } from "../store/session";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const MAIN: NavItem[] = [
  { path: "/", label: NAV_LABEL.home, icon: Home },
  { path: "/base", label: NAV_LABEL.base, icon: Building2 },
  { path: "/grupos", label: NAV_LABEL.grupos, icon: Users },
  { path: "/funil", label: NAV_LABEL.funil, icon: Briefcase, roles: ["admin", "gestor", "corretor"] },
  { path: "/operacoes", label: NAV_LABEL.operacoes, icon: ClipboardList, roles: ["admin", "gestor", "operacoes"] },
  { path: "/atividades", label: NAV_LABEL.atividades, icon: CalendarCheck },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "gestor"] },
];

const OTHERS: NavItem[] = [
  { path: "/admin", label: NAV_LABEL.admin, icon: Shield, roles: ["admin"] },
  { path: "/configuracoes", label: NAV_LABEL.configuracoes, icon: Settings, roles: ["admin", "gestor"] },
];

export function Sidebar() {
  const { user, logout } = useSession();
  const { path, navigate } = useHashRoute();
  if (!user) return null;

  const isActive = (p: string) =>
    p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`);

  const filter = (list: NavItem[]) =>
    list.filter((it) => !it.roles || it.roles.includes(user.role));

  const renderItem = (it: NavItem) => {
    const active = isActive(it.path);
    const Icon = it.icon;
    return (
      <button
        key={it.path}
        onClick={() => navigate(it.path)}
        className={`mb-0.5 flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{it.label}</span>
      </button>
    );
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <div className="text-[15px] font-semibold tracking-tight">Alias CRM</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Menu principal
        </div>
        {filter(MAIN).map(renderItem)}

        {filter(OTHERS).length > 0 && (
          <div className="mb-2 mt-6 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Outros
          </div>
        )}
        {filter(OTHERS).map(renderItem)}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user.nome}</div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  );
}
