// Dashboard inicial — KPIs comerciais. Consome GET /dashboard/comercial.
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import {
  ErrorState,
  KpiCard,
  LoadingState,
  SectionCard,
} from "../components/feedback";
import {
  getDashboardComercial,
  type DashboardKpis,
} from "../services/dashboard";
import { useSession } from "../store/session";
import { ROLE_LABEL } from "../labels";

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function HomePage() {
  const { user } = useSession();
  const [data, setData] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    getDashboardComercial()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const isGestor = user?.role === "gestor" || user?.role === "admin";

  return (
    <PageShell>
      <PageHeader
        title={`Olá, ${user?.nome ?? ""}`}
        description={user ? `Perfil: ${ROLE_LABEL[user.role]}` : undefined}
      />

      {loading ? (
        <LoadingState label="Carregando indicadores..." />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Oportunidades abertas"
              value={data.oportunidadesAbertas}
              hint="Todos os pipelines"
            />
            <KpiCard
              label="Ganhas (30d)"
              value={data.ganhas30d}
              tone="success"
            />
            <KpiCard
              label="Perdidas (30d)"
              value={data.perdidas30d}
              tone="danger"
            />
            <KpiCard
              label="Win rate"
              value={`${Math.round(data.winRate * 100)}%`}
              tone="success"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <KpiCard
              label="Pipeline mensal (estim.)"
              value={fmtBRL(data.pipelineValor)}
              hint="Soma do valor estimado mensal em abertas"
            />
            <KpiCard
              label="Próximas ações"
              value={data.proximasAcoes}
              hint="Atividades pendentes"
              tone="warn"
            />
          </div>

          <SectionCard title="Distribuição por estágio">
            {data.porEstagio.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma oportunidade aberta.
              </div>
            ) : (
              <ul className="space-y-2">
                {data.porEstagio.map((e) => {
                  const max = Math.max(
                    ...data.porEstagio.map((x) => x.total),
                    1,
                  );
                  const pct = (e.total / max) * 100;
                  return (
                    <li key={e.estagio} className="text-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{e.estagio}</span>
                        <span>{e.total}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {isGestor ? (
            <SectionCard title="Visão de gestão">
              <p className="text-sm text-muted-foreground">
                Acesse{" "}
                <a
                  href="#/relatorios"
                  className="font-medium text-primary hover:underline"
                >
                  Relatórios
                </a>{" "}
                para funil, conversão, ranking e motivos de perda.
              </p>
            </SectionCard>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
