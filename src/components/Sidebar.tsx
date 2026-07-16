// Sidebar com itens filtrados por RBAC.
import type { Role } from "../types";
import { NAV_LABEL } from "../labels";
import { useHashRoute } from "../hooks/useHashRoute";
import { useSession } from "../store/session";

interface NavItem {
  path: string;
  label: string;
  roles?: Role[]; // undefined = todos autenticados
}

const NAV: NavItem[] = [
  { path: "/", label: NAV_LABEL.home },
  { path: "/base", label: NAV_LABEL.base },
  { path: "/grupos", label: NAV_LABEL.grupos },
  { path: "/funil", label: NAV_LABEL.funil, roles: ["admin", "gestor", "corretor"] },
  { path: "/operacoes", label: NAV_LABEL.operacoes, roles: ["admin", "gestor", "operacoes"] },
  { path: "/atividades", label: NAV_LABEL.atividades },
  { path: "/admin", label: NAV_LABEL.admin, roles: ["admin"] },
  {
    path: "/admin/registradoras",
    label: NAV_LABEL.registradoras,
    roles: ["admin", "registradora"],
  },
  { path: "/configuracoes", label: NAV_LABEL.configuracoes },
];

export function Sidebar() {
  const { user, logout } = useSession();
  const { path, navigate } = useHashRoute();
  if (!user) return null;

  const items = NAV.filter((it) => !it.roles || it.roles.includes(user.role));

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-border px-4 py-4">
        <div className="text-lg font-semibold">Alias CRM</div>
        <div className="mt-1 text-xs text-muted-foreground">{user.nome}</div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((it) => {
          const active =
            it.path === "/"
              ? path === "/"
              : path === it.path || path.startsWith(`${it.path}/`);
          return (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={() => logout()}
          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-sidebar-accent/60"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
