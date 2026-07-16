// Relatórios: 4 relatórios básicos + export CSV.
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionCard,
} from "../components/feedback";
import {
  exportarRelatorioCsv,
  getRelatorio,
  type RelatorioResultado,
  type RelatorioTipo,
} from "../services/relatorios";

const TIPOS: { key: RelatorioTipo; label: string }[] = [
  { key: "funil", label: "Funil por estágio" },
  { key: "conversao", label: "Conversão" },
  { key: "ranking", label: "Ranking por owner" },
  { key: "motivos-perda", label: "Motivos de perda" },
];

export function RelatoriosPage() {
  const [tipo, setTipo] = useState<RelatorioTipo>("funil");
  const [data, setData] = useState<RelatorioResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function load(t: RelatorioTipo) {
    setLoading(true);
    setError(null);
    getRelatorio(t)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(tipo);
  }, [tipo]);

  return (
    <PageShell>
      <PageHeader
        title="Relatórios"
        description="Visões operacionais e export CSV."
        actions={
          data && !loading && !error ? (
            <button
              onClick={() => exportarRelatorioCsv(data)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Exportar CSV
            </button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTipo(t.key)}
            className={`rounded-full border px-3 py-1 text-xs ${
              tipo === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => load(tipo)} />
      ) : !data || data.rows.length === 0 ? (
        <EmptyState title="Sem dados" description="Nenhum registro no período." />
      ) : (
        <SectionCard title={data.titulo}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.chave} className="border-b border-border/60 last:border-0">
                  <td className="py-2">{r.label}</td>
                  <td className="py-2 text-right font-medium">{r.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </PageShell>
  );
}
