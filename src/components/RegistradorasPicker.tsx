// RegistradorasPicker — multi-select com busca + chips.
// Fonte: registradorasService.list (fallback mock).
import { useEffect, useMemo, useState } from "react";
import { registradorasService } from "../services/registradoras";
import type { Registradora } from "../types";

interface Props {
  selectedIds: string[];
  onChange: (ids: string[], nomes: string[]) => void;
  naoInformado: boolean;
  onNaoInformadoChange: (v: boolean) => void;
  disabled?: boolean;
}

export function RegistradorasPicker({
  selectedIds,
  onChange,
  naoInformado,
  onNaoInformadoChange,
  disabled,
}: Props) {
  const [all, setAll] = useState<Registradora[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    registradorasService
      .list({ search: search || undefined })
      .then((data) => {
        if (alive) setAll(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [search]);

  const byId = useMemo(() => {
    const m = new Map<string, Registradora>();
    for (const r of all) m.set(r.id, r);
    return m;
  }, [all]);

  function toggle(id: string) {
    const set = new Set(selectedIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const ids = Array.from(set);
    const nomes = ids.map((i) => byId.get(i)?.nome ?? i);
    onChange(ids, nomes);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Registradoras contratadas
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={naoInformado}
            onChange={(e) => onNaoInformadoChange(e.target.checked)}
            disabled={disabled}
          />
          Não informado
        </label>
      </div>

      {naoInformado ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Marcado como não informado.
        </p>
      ) : (
        <>
          {selectedIds.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
                >
                  {byId.get(id)?.nome ?? id}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          ) : null}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar registradora…"
            disabled={disabled}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm"
          />
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background">
            {loading ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Carregando…
              </p>
            ) : all.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Nenhuma registradora encontrada.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {all.map((r) => (
                  <li key={r.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggle(r.id)}
                        disabled={disabled}
                      />
                      <span className="flex-1 truncate">{r.nome}</span>
                      {r.cnpj ? (
                        <span className="text-[10px] text-muted-foreground">
                          {r.cnpj}
                        </span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
