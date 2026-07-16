// Página #/oportunidades/:id — Camada 2.
// Layout 70/30, abas Atividades | Notas | Histórico | Detalhes.
// Checkbox de atividade abre desfecho (se ação != NENHUMA) ou conclui direto.
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { matchRoute, useHashRoute } from "../hooks/useHashRoute";
import { oportunidadesService } from "../services/oportunidades";
import { atividadesService } from "../services/atividades";
import { notasService } from "../services/notas";
import { ApiError } from "../services/api";
import type {
  AcaoAtividade,
  AtividadeListItem,
  Nota,
  OportunidadeListItem,
  TimelineItem,
  WorkflowAtual,
} from "../types";
import { estagioLabel, resolveAcaoAtividade } from "../domain";
import {
  STATUS_ATIVIDADE_LABEL,
  TIPO_ATIVIDADE_LABEL,
} from "../labels";
import { formatBRL, formatDateTime } from "../format";
import { DesfechoAtividadeModal } from "../components/DesfechoAtividadeModal";

type Tab = "atividades" | "notas" | "historico" | "detalhes";

export function OportunidadeDetailPage() {
  const route = useHashRoute();
  const params = matchRoute("/oportunidades/:id", route);
  const id = params?.id ?? "";

  const [opp, setOpp] = useState<OportunidadeListItem | null>(null);
  const [atividades, setAtividades] = useState<AtividadeListItem[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowAtual | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("atividades");
  const [modalAtividade, setModalAtividade] =
    useState<AtividadeListItem | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [o, a, w] = await Promise.all([
        oportunidadesService.get(id),
        atividadesService.list({ oportunidadeId: id }),
        oportunidadesService.workflow(id).catch(() => null),
      ]);
      setOpp(o);
      setAtividades(Array.isArray(a) ? a : []);
      setWorkflow(w);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Falha ao carregar oportunidade. Backend disponível em :3001?",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Notas/timeline sob demanda por aba.
  useEffect(() => {
    if (!id) return;
    if (tab === "notas") {
      notasService.list(id).then(setNotas).catch(() => setNotas([]));
    } else if (tab === "historico") {
      oportunidadesService
        .timeline(id)
        .then(setTimeline)
        .catch(() => setTimeline([]));
    }
  }, [tab, id]);

  const sortedAtividades = useMemo(() => {
    return [...atividades].sort((a, b) => {
      const oa = a.templateItem?.ordem ?? 999;
      const ob = b.templateItem?.ordem ?? 999;
      if (oa !== ob) return oa - ob;
      const da = a.dataHora ? new Date(a.dataHora).getTime() : 0;
      const db = b.dataHora ? new Date(b.dataHora).getTime() : 0;
      return da - db;
    });
  }, [atividades]);

  const titulo = opp?.conta?.nomeFantasia ||
    opp?.conta?.razaoSocial ||
    "Oportunidade";

  async function toggleAtividade(a: AtividadeListItem) {
    if (a.status === "CONCLUIDA") return;
    const acao = resolveAcaoAtividade(a);
    if (acao === "NENHUMA") {
      try {
        await atividadesService.updateStatus(a.id, "CONCLUIDA");
        await refetch();
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Falha ao concluir atividade.",
        );
      }
      return;
    }
    setModalAtividade(a);
  }

  return (
    <PageShell>
      <PageHeader
        title={titulo}
        description={
          opp
            ? `${estagioLabel(opp.estagio)} • ${opp.status === "ABERTA" ? "Aberta" : opp.status === "CLOSED_WON" ? "Ganha" : "Perdida"}`
            : id
              ? `ID: ${id}`
              : undefined
        }
        actions={
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted"
          >
            ← Voltar
          </button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading && !opp ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Carregando oportunidade…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-1 border-b border-border">
              {(
                [
                  ["atividades", "Atividades"],
                  ["notas", "Notas"],
                  ["historico", "Histórico"],
                  ["detalhes", "Detalhes"],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                    tab === key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "atividades" ? (
              <AtividadesTab
                atividades={sortedAtividades}
                onToggle={toggleAtividade}
              />
            ) : null}
            {tab === "notas" ? <NotasTab notas={notas} /> : null}
            {tab === "historico" ? <HistoricoTab items={timeline} /> : null}
            {tab === "detalhes" && opp ? <DetalhesTab opp={opp} /> : null}
          </section>

          <aside className="space-y-4">
            <WorkflowPanel workflow={workflow} status={opp?.status ?? "ABERTA"} />
            {opp ? <ResumoPanel opp={opp} /> : null}
          </aside>
        </div>
      )}

      {modalAtividade ? (
        <DesfechoAtividadeModal
          open
          onClose={() => setModalAtividade(null)}
          oportunidadeId={id}
          atividade={modalAtividade}
          acao={resolveAcaoAtividade(modalAtividade) as AcaoAtividade}
          onApplied={() => {
            setModalAtividade(null);
            refetch();
          }}
        />
      ) : null}
    </PageShell>
  );
}

function AtividadesTab({
  atividades,
  onToggle,
}: {
  atividades: AtividadeListItem[];
  onToggle: (a: AtividadeListItem) => void;
}) {
  if (atividades.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade registrada.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {atividades.map((a) => {
        const done = a.status === "CONCLUIDA";
        return (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3"
          >
            <button
              type="button"
              onClick={() => onToggle(a)}
              disabled={done}
              aria-label="Concluir atividade"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border bg-background hover:border-primary"
              }`}
            >
              {done ? "✓" : ""}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {a.titulo}
                </p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {TIPO_ATIVIDADE_LABEL[a.tipo] ?? a.tipo}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {STATUS_ATIVIDADE_LABEL[a.status] ?? a.status}
                </span>
                {a.obrigatoria ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Obrigatória
                  </span>
                ) : null}
              </div>
              {a.dataHora ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(a.dataHora)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function NotasTab({ notas }: { notas: Nota[] }) {
  if (notas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhuma nota registrada.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {notas.map((n) => (
        <li
          key={n.id}
          className="rounded-lg border border-border bg-card px-3 py-3"
        >
          <p className="whitespace-pre-wrap text-sm text-foreground">{n.texto}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateTime(n.criadaEm)}
            {n.autorNome ? ` • ${n.autorNome}` : ""}
            {n.contatoNome ? ` • Contato: ${n.contatoNome}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function HistoricoTab({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Sem eventos no histórico.
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="rounded-lg border border-border bg-card px-3 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{it.titulo}</p>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {it.tipo}
            </span>
          </div>
          {it.descricao ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {it.descricao}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(it.data)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function DetalhesTab({ opp }: { opp: OportunidadeListItem }) {
  const rows: [string, string][] = [
    ["Pipeline", opp.pipeline],
    ["Estágio", estagioLabel(opp.estagio)],
    [
      "Produto",
      opp.produto === "E_REGISTRO"
        ? "e-Registro"
        : opp.produto === "E_BUSCAR"
          ? "e-BusCar"
          : "—",
    ],
    ["Valor mensal", formatBRL(opp.valorEstimadoMensal ?? undefined)],
    ["Owner", opp.owner?.nome ?? "—"],
    ["Conta", opp.conta?.razaoSocial || opp.conta?.nomeFantasia || "—"],
  ];
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="rounded-lg border border-border bg-card px-3 py-2"
        >
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {k}
          </dt>
          <dd className="text-sm text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkflowPanel({
  workflow,
  status,
}: {
  workflow: WorkflowAtual | null;
  status: string;
}) {
  if (status !== "ABERTA") {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Oportunidade {status === "CLOSED_WON" ? "ganha" : "perdida"}.
      </div>
    );
  }
  if (!workflow) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Progresso do estágio indisponível.
      </div>
    );
  }
  const pct = workflow.totalObrigatorias
    ? Math.round(
        (workflow.concluidasObrigatorias / workflow.totalObrigatorias) * 100,
      )
    : 100;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Progresso do estágio
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {estagioLabel(workflow.estagio)}
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {workflow.concluidasObrigatorias}/{workflow.totalObrigatorias}{" "}
        obrigatórias
      </p>
    </div>
  );
}

function ResumoPanel({ opp }: { opp: OportunidadeListItem }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Resumo
      </p>
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Valor mensal</dt>
          <dd className="font-medium text-foreground">
            {formatBRL(opp.valorEstimadoMensal ?? undefined)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="text-foreground">{opp.owner?.nome ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Pipeline</dt>
          <dd className="text-foreground">{opp.pipeline}</dd>
        </div>
      </dl>
    </div>
  );
}
