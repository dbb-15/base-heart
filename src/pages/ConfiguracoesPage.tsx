// #/configuracoes — Cadência de follow-ups.
import { useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { Field } from "../components/Field";
import { configuracoesService } from "../services/configuracoes";
import type { Cadencia } from "../types";
import { ApiError } from "../services/api";

const LABELS: Record<keyof Cadencia, { label: string; hint: string }> = {
  primeiroContatoDias: {
    label: "Primeiro contato",
    hint: "Dias até novo follow após tentativa sem sucesso.",
  },
  retornoEmailDias: {
    label: "Retorno de e-mail",
    hint: "Dias para acompanhar e-mail sem resposta.",
  },
  retornoPropostaDias: {
    label: "Retorno de proposta",
    hint: "Dias para acompanhar proposta em análise.",
  },
  negociacaoDias: {
    label: "Follow-up de negociação",
    hint: "Padrão de dias para novo follow em negociação.",
  },
  recuperacaoLeadDias: {
    label: "Recuperação de lead perdido",
    hint: "Dias após perda até tentativa de reativação.",
  },
  standbyExpansaoDias: {
    label: "Standby de expansão",
    hint: "Dias para retomar contato em standby.",
  },
};

export function ConfiguracoesPage() {
  const [form, setForm] = useState<Cadencia | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    configuracoesService.getCadencia().then(setForm);
  }, []);

  async function submit() {
    if (!form) return;
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      await configuracoesService.updateCadencia(form);
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar cadência.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Configurações de funis"
        description="Dias padrão de follow-up por tipo de atividade."
      />
      {!form ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          Carregando…
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(LABELS) as (keyof Cadencia)[]).map((key) => {
              const meta = LABELS[key];
              return (
                <div key={key} className="rounded-lg border border-border bg-background/40 p-3">
                  <Field label={meta.label}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={form[key]}
                        onChange={(e) =>
                          setForm((f) =>
                            f ? { ...f, [key]: Number(e.target.value) } : f,
                          )
                        }
                        className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">dias</span>
                    </div>
                  </Field>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.hint}</p>
                </div>
              );
            })}
          </div>
          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {ok ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Cadência salva.
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar cadência"}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
