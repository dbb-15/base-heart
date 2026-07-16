// Página de Funil.
// Camada 1: Aquisição (kanban read-only por estágio).
// Camada 4: Expansão (3 visões: Mapeamento | UF | Volume) + Nova expansão.
import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { NovaExpansaoDrawer } from "../components/NovaExpansaoDrawer";
import { navigate } from "../hooks/useHashRoute";
import { oportunidadesService } from "../services/oportunidades";
import { ApiError } from "../services/api";
import type {
  OportunidadeListItem,
  Pipeline,
  Produto,
  TipoExpansao,
} from "../types";
import { formatBRL } from "../format";

interface ColumnDef {
  key: string;
  label: string;
}

const ESTAGIOS_AQUISICAO: ColumnDef[] = [
  { key: "PROSPECCAO", label: "Prospecção" },
  { key: "QUALIFICACAO", label: "Qualificação" },
  { key: "APRESENTACAO", label: "Apresentação" },
  { key: "PROPOSTA", label: "Proposta" },
  { key: "NEGOCIACAO", label: "Negociação" },
  { key: "FECHAMENTO", label: "Fechamento" },
  { key: "AGUARDANDO_REGISTROS", label: "Aguardando registros" },
];

type ExpansaoView = "mapeamento" | "uf" | "volume";

interface ExpansaoViewDef {
  key: ExpansaoView;
  label: string;
  cols: ColumnDef[];
  filter: (o: OportunidadeListItem) => boolean;
}

const EXPANSAO_VIEWS: ExpansaoViewDef[] = [
  {
    key: "mapeamento",
    label: "Mapeamento",
    cols: [
      { key: "MAPEAMENTO", label: "Mapeamento" },
      { key: "STANDBY", label: "Standby" },
    ],
    filter: (o) => o.estagio === "MAPEAMENTO" || o.estagio === "STANDBY",
  },
  {
    key: "uf",
    label: "Aumento de UF",
    cols: [
      { key: "PROPOSTA", label: "Proposta" },
      { key: "NEGOCIACAO", label: "Negociação" },
      { key: "FECHAMENTO", label: "Fechamento" },
      { key: "AGUARDANDO_REGISTROS", label: "Aguardando registros" },
    ],
    filter: (o) =>
      o.tipoExpansao === "UF" &&
      o.estagio !== "MAPEAMENTO" &&
      o.estagio !== "STANDBY",
  },
  {
    key: "volume",
    label: "Aumento de volume",
    cols: [
      { key: "SEM_CONTATO", label: "Sem contato" },
      { key: "EM_CONTATO", label: "Em contato" },
      { key: "NEGOCIANDO", label: "Negociando" },
      { key: "FECHADO", label: "Fechado" },
      { key: "AGUARDANDO_REGISTROS", label: "Aguardando registros" },
    ],
    filter: (o) =>
      o.tipoExpansao === "VOLUME" &&
      o.estagio !== "MAPEAMENTO" &&
      o.estagio !== "STANDBY",
  },
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
  const [view, setView] = useState<ExpansaoView>("mapeamento");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isExpansao = pipeline === "EXPANSAO";

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
  }, [pipeline, filters.produto, filters.ownerId, filters.search, reloadKey]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of items) {
      if (o.owner?.id) map.set(o.owner.id, o.owner.nome);
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }, [items]);

  const activeView = EXPANSAO_VIEWS.find((v) => v.key === view) ?? EXPANSAO_VIEWS[0];

  const visibleItems = useMemo(() => {
    if (!isExpansao) return items;
    return items.filter(activeView.filter);
  }, [items, isExpansao, activeView]);

  const columns = useMemo(() => {
    const defs: ColumnDef[] = isExpansao ? activeView.cols : ESTAGIOS_AQUISICAO;
    const grouped = new Map<string, OportunidadeListItem[]>();
    for (const c of defs) grouped.set(c.key, []);
    for (const opp of visibleItems) {
      const key = opp.estagio || "OUTROS";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(opp);
    }
    return Array.from(grouped, ([key, opps]) => ({
      key,
      label: defs.find((c) => c.key === key)?.label ?? key,
      opps,
    }));
  }, [visibleItems, isExpansao, activeView]);

  const title = isExpansao ? "Funil de Expansão" : "Funil de Aquisição";
  const description = isExpansao
    ? "Kanban read-only por visão (Mapeamento / UF / Volume). Clique em um card para abrir."
    : "Kanban read-only. Clique em um card para abrir a oportunidade.";

  return (
    <PageShell>
      <PageHeader
        title={title}
        description={description}
        actions={
          isExpansao ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              + Nova expansão
            </button>
          ) : null
        }
      />

      {isExpansao ? (
        <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
          {EXPANSAO_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                view === v.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {items.filter(v.filter).length}
              </span>
            </button>
          ))}
        </div>
      ) : null}

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

      {isExpansao ? (
        <NovaExpansaoDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCreated={(id) => {
            setReloadKey((k) => k + 1);
            navigate(`/oportunidades/${id}`);
          }}
        />
      ) : null}
    </PageShell>
  );
}

function tipoExpansaoBadge(t?: TipoExpansao | null) {
  if (!t) return null;
  const label = t === "UF" ? "UF" : t === "VOLUME" ? "Volume" : "Standby";
  return (
    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
      {label}
    </span>
  );
}

function OpportunityCard({ opp }: { opp: OportunidadeListItem }) {
  const conta =
    opp.conta?.nomeFantasia || opp.conta?.razaoSocial || "Financeira sem nome";
  const produto = opp.produto ? PRODUTO_LABEL[opp.produto] : "—";
  return (
    <button
      type="button"
      onClick={() => navigate(`/oportunidades/${opp.id}`)}
      className="group rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary hover:shadow"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {conta}
        </p>
        {tipoExpansaoBadge(opp.tipoExpansao)}
      </div>
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
