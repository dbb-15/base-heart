// Sino de notificações no topo. Popover simples.
import { useEffect, useState } from "react";
import {
  listNotificacoes,
  marcarLida,
  type Notificacao,
} from "../services/notificacoes";

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificacoesBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listNotificacoes()
      .then((res) => {
        if (alive) setItems(res);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const unread = items.filter((n) => !n.lida).length;

  async function abrir(n: Notificacao) {
    if (!n.lida) {
      await marcarLida(n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)),
      );
    }
    if (n.link) window.location.hash = n.link.replace(/^#/, "");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative rounded-full border border-border bg-background p-2 text-muted-foreground hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
          <path d="M10 20a2 2 0 1 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
            <div className="border-b border-border px-3 py-2 text-sm font-semibold">
              Notificações
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-xs text-muted-foreground">Carregando...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  Nenhuma notificação.
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => abrir(n)}
                    className={`block w-full border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted ${
                      n.lida ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{n.titulo}</span>
                      {!n.lida ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    {n.descricao ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {n.descricao}
                      </div>
                    ) : null}
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {formatarData(n.criadaEm)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
