// Sidebar com itens filtrados por RBAC.
import { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../types";
import { NAV_LABEL } from "../labels";
import { useHashRoute } from "../hooks/useHashRoute";
import { useSession } from "../store/session";
import logoFull from "../assets/tie-logo-full.svg";
import logoIcon from "../assets/tie-logo-icon.svg";

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
  const [collapsed, setCollapsed] = useState(false);
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
        title={collapsed ? it.label : undefined}
        className={`relative mb-0.5 flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-sidebar-accent text-sidebar-primary font-medium"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-sidebar-primary" />
        )}
        <Icon
          className={`h-4 w-4 shrink-0 ${active ? "text-sidebar-primary" : ""}`}
          strokeWidth={1.75}
        />
        {!collapsed && <span className="truncate">{it.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`group sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-4 ${collapsed ? "justify-center px-2" : "justify-between pl-4 pr-2"}`}>
        {collapsed ? (
          <img src={logoIcon} alt="TIE" className="h-16 w-auto" />
        ) : (
          <img src={logoFull} alt="TIE" className="h-16 w-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`rounded-sm p-1.5 text-muted-foreground transition-all hover:bg-sidebar-accent/60 ${
            collapsed
              ? "pointer-events-none absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-sidebar-border bg-sidebar shadow-sm opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
              : ""
          }`}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Menu principal
          </div>
        )}
        {filter(MAIN).map(renderItem)}

        {filter(OTHERS).length > 0 && !collapsed && (
          <div className="mb-2 mt-6 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Outros
          </div>
        )}
        {collapsed && filter(OTHERS).length > 0 && <div className="my-3 border-t border-sidebar-border" />}
        {filter(OTHERS).map(renderItem)}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user.nome}</div>
        )}
        <button
          onClick={() => logout()}
          title={collapsed ? "Sair" : undefined}
          className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
