// Página de Funil (Camada 1).
// Kanban read-only: colunas por estágio, cards clicáveis SEM drag-and-drop.
// Fonte: GET /oportunidades?pipeline=AQUISICAO via services/oportunidades.
import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { navigate } from "../hooks/useHashRoute";
import { oportunidadesService } from "../services/oportunidades";
import { ApiError } from "../services/api";
import type { OportunidadeListItem, Pipeline, Produto } from "../types";
import { formatBRL } from "../format";

const ESTAGIOS_AQUISICAO: { key: string; label: string }[] = [
  { key: "PROSPECCAO", label: "Prospecção" },
  { key: "QUALIFICACAO", label: "Qualificação" },
  { key: "APRESENTACAO", label: "Apresentação" },
  { key: "PROPOSTA", label: "Proposta" },
  { key: "NEGOCIACAO", label: "Negociação" },
  { key: "FECHAMENTO", label: "Fechamento" },
  { key: "AGUARDANDO_REGISTROS", label: "Aguardando registros" },
];

const PRODUTO_LABEL: Record<Produto, string> = {
  E_REGISTRO: "e-Registro",
  E_BUSCAR: "e-BusCar",
};

interface Filters {
  search: string;
  ownerId: string;
  produto: "" | Produto;
}

export function FunilPage({
  pipeline = "AQUISICAO",
}: {
  pipeline?: Pipeline;
}) {
  const [items, setItems] = useState<OportunidadeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    ownerId: "",
    produto: "",
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    oportunidadesService
      .list({
        pipeline,
        status: "ABERTA",
        produto: filters.produto || undefined,
        ownerId: filters.ownerId || undefined,
        search: filters.search || undefined,
      })
      .then((data) => {
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Falha ao carregar oportunidades. Backend disponível em :3001?";
        setError(msg);
        setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pipeline, filters.produto, filters.ownerId, filters.search]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of items) {
      if (o.owner?.id) map.set(o.owner.id, o.owner.nome);
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }, [items]);

  const columns = useMemo(() => {
    const known = new Map(ESTAGIOS_AQUISICAO.map((e) => [e.key, e.label]));
    const grouped = new Map<string, OportunidadeListItem[]>();
    for (const e of ESTAGIOS_AQUISICAO) grouped.set(e.key, []);
    for (const opp of items) {
      const key = opp.estagio || "OUTROS";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(opp);
    }
    return Array.from(grouped, ([key, opps]) => ({
      key,
      label: known.get(key) ?? key,
      opps,
    }));
  }, [items]);

  return (
    <PageShell>
      <PageHeader
        title="Funil de Aquisição"
        description="Kanban read-only. Clique em um card para abrir a oportunidade."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar por conta, produto..."
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={filters.produto}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              produto: e.target.value as "" | Produto,
            }))
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Todos os produtos</option>
          <option value="E_REGISTRO">e-Registro</option>
          <option value="E_BUSCAR">e-BusCar</option>
        </select>
        <select
          value={filters.ownerId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, ownerId: e.target.value }))
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Todos os owners</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Carregando oportunidades...
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {col.label}
                </h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {col.opps.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.opps.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhuma oportunidade
                  </p>
                ) : (
                  col.opps.map((opp) => (
                    <OpportunityCard key={opp.id} opp={opp} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function OpportunityCard({ opp }: { opp: OportunidadeListItem }) {
  const conta =
    opp.conta?.nomeFantasia ||
    opp.conta?.razaoSocial ||
    "Financeira sem nome";
  const produto = opp.produto ? PRODUTO_LABEL[opp.produto] : "—";
  return (
    <button
      type="button"
      onClick={() => navigate(`/oportunidades/${opp.id}`)}
      className="group rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary hover:shadow"
    >
      <p className="mb-1 truncate text-sm font-semibold text-foreground">
        {conta}
      </p>
      <p className="text-xs text-muted-foreground">{produto}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {formatBRL(opp.valorEstimadoMensal ?? undefined)}
        </span>
        <span className="truncate text-muted-foreground">
          {opp.owner?.nome ?? "sem owner"}
        </span>
      </div>
    </button>
  );
}
