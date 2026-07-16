// Camada 5 — Operações
// Abas: Cadastro (kanban pipeline OPERACOES) | Atendimento | Demandas
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { Modal } from "../components/Modal";
import { navigate } from "../hooks/useHashRoute";
import { oportunidadesService } from "../services/oportunidades";
import { MOCK_OPS_ORIGEM } from "../services/mocks";
import type { OportunidadeListItem } from "../types";
import {
  atendimentosService,
  type Atendimento,
  type AtendimentoInput,
  type AtendimentoCanal,
  type AtendimentoClassificacao,
} from "../services/atendimentos";
import {
  demandasService,
  NIVEIS,
  NIVEL_LABEL,
  type Demanda,
  type DemandaInput,
  type Nivel,
} from "../services/demandas";

type Tab = "cadastro" | "atendimento" | "demandas";

const ESTAGIOS_OPS: { id: string; label: string }[] = [
  { id: "CADASTRO", label: "Cadastro" },
  { id: "CADASTRO_REALIZADO", label: "Cadastro realizado" },
];

const CLASSIF_LABEL: Record<AtendimentoClassificacao, string> = {
  INFORMACAO: "Informação",
  SOLICITACAO: "Solicitação",
  RECLAMACAO: "Reclamação",
};
const CANAL_LABEL: Record<AtendimentoCanal, string> = {
  EMAIL: "E-mail",
  TELEFONE: "Telefone",
  WHATSAPP: "WhatsApp",
  PORTAL: "Portal",
  OUTRO: "Outro",
};

export function OperacoesPage() {
  const [tab, setTab] = useState<Tab>("cadastro");
  return (
    <PageShell>
      <PageHeader
        title="Operações"
        description="Cadastro pós-fechamento, atendimentos e demandas."
      />
      <div className="mb-4 flex gap-2 border-b border-border">
        {(
          [
            ["cadastro", "Cadastro"],
            ["atendimento", "Atendimento"],
            ["demandas", "Demandas"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              tab === id
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cadastro" && <CadastroTab />}
      {tab === "atendimento" && <AtendimentoTab />}
      {tab === "demandas" && <DemandasTab />}
    </PageShell>
  );
}

/* ---------------- Cadastro (kanban) ---------------- */

function CadastroTab() {
  const [opps, setOpps] = useState<OportunidadeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    oportunidadesService
      .list({ pipeline: "OPERACOES" })
      .then((d) => alive && setOpps(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const porEstagio = useMemo(() => {
    const map: Record<string, OportunidadeListItem[]> = {};
    for (const e of ESTAGIOS_OPS) map[e.id] = [];
    for (const o of opps) {
      if (!map[o.estagio]) map[o.estagio] = [];
      map[o.estagio].push(o);
    }
    return map;
  }, [opps]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Cadastro realizado libera o comercial para "Aguardando registros" — <b>não</b> fecha ganha.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ESTAGIOS_OPS.map((e) => {
          const cards = porEstagio[e.id] ?? [];
          return (
            <div
              key={e.id}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {e.label}
                </h3>
                <span className="text-xs text-muted-foreground">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Sem cards.
                  </div>
                ) : (
                  cards.map((o) => <OpsCard key={o.id} opp={o} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpsCard({ opp }: { opp: OportunidadeListItem }) {
  const origem = MOCK_OPS_ORIGEM[opp.id];
  return (
    <div
      onClick={() => navigate(`/oportunidades/${opp.id}`)}
      className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary"
    >
      <div className="text-sm font-medium text-foreground">
        {opp.conta?.nomeFantasia ?? opp.conta?.razaoSocial ?? "—"}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {opp.produto === "E_REGISTRO" ? "e-Registro" : opp.produto === "E_BUSCAR" ? "e-BusCar" : ""}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{opp.owner?.nome ?? ""}</span>
        {origem ? (
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              navigate(`/oportunidades/${origem}`);
            }}
            className="text-primary hover:underline"
          >
            Opp origem →
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Atendimento ---------------- */

function AtendimentoTab() {
  const [items, setItems] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);

  const refresh = () => {
    setLoading(true);
    atendimentosService.list().then((d) => {
      setItems(d);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  return (
    <SectionCard
      title="Atendimentos"
      action={
        <button
          onClick={() => setOpenNew(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          + Novo atendimento
        </button>
      }
    >
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <EmptyState note="Nenhum atendimento registrado." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Conta</th>
                <th className="py-2 pr-3">Classificação</th>
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">UF</th>
                <th className="py-2 pr-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">{a.contaNome ?? "—"}</td>
                  <td className="py-2 pr-3">{CLASSIF_LABEL[a.classificacao]}</td>
                  <td className="py-2 pr-3">{CANAL_LABEL[a.canal]}</td>
                  <td className="py-2 pr-3">{a.tipoDemanda ?? "—"}</td>
                  <td className="py-2 pr-3">{a.ufDetran ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openNew && (
        <NovoAtendimentoModal
          onClose={() => setOpenNew(false)}
          onSaved={() => {
            setOpenNew(false);
            refresh();
          }}
        />
      )}
    </SectionCard>
  );
}

function NovoAtendimentoModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AtendimentoInput>({
    contaNome: "",
    classificacao: "SOLICITACAO",
    canal: "EMAIL",
    tipoDemanda: "",
    ufDetran: "",
    chassi: "",
    descricao: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.descricao.trim()) return;
    setSaving(true);
    try {
      await atendimentosService.create(form);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Novo atendimento">
      <div className="grid gap-3">
        <Field label="Conta">
          <input
            className={inputCls}
            value={form.contaNome}
            onChange={(e) => setForm({ ...form, contaNome: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Classificação">
            <select
              className={inputCls}
              value={form.classificacao}
              onChange={(e) =>
                setForm({
                  ...form,
                  classificacao: e.target.value as AtendimentoClassificacao,
                })
              }
            >
              {Object.entries(CLASSIF_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Canal">
            <select
              className={inputCls}
              value={form.canal}
              onChange={(e) =>
                setForm({ ...form, canal: e.target.value as AtendimentoCanal })
              }
            >
              {Object.entries(CANAL_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo de demanda">
            <input
              className={inputCls}
              value={form.tipoDemanda}
              onChange={(e) => setForm({ ...form, tipoDemanda: e.target.value })}
            />
          </Field>
          <Field label="UF Detran">
            <input
              className={inputCls}
              value={form.ufDetran}
              maxLength={2}
              onChange={(e) =>
                setForm({ ...form, ufDetran: e.target.value.toUpperCase() })
              }
            />
          </Field>
          <Field label="Chassi">
            <input
              className={inputCls}
              value={form.chassi}
              onChange={(e) => setForm({ ...form, chassi: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Descrição">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !form.descricao.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Demandas ---------------- */

function DemandasTab() {
  const [items, setItems] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);

  const refresh = () => {
    setLoading(true);
    demandasService.list().then((d) => {
      setItems(d);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  return (
    <div>
      <SectionCard
        title="Demandas"
        action={
          <button
            onClick={() => setOpenNew(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
          >
            + Nova demanda
          </button>
        }
      >
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <EmptyState note="Nenhuma demanda registrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Título</th>
                  <th className="py-2 pr-3">Conta</th>
                  <th className="py-2 pr-3">Dificuldade</th>
                  <th className="py-2 pr-3">Impacto</th>
                  <th className="py-2 pr-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{d.titulo}</td>
                    <td className="py-2 pr-3">{d.contaNome ?? "—"}</td>
                    <td className="py-2 pr-3">{NIVEL_LABEL[d.dificuldade]}</td>
                    <td className="py-2 pr-3">{NIVEL_LABEL[d.impacto]}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {new Date(d.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {openNew && (
        <NovaDemandaModal
          onClose={() => setOpenNew(false)}
          onSaved={() => {
            setOpenNew(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function matrizTone(dif: Nivel, imp: Nivel): string {
  const score = (dif === "ALTO" ? 2 : dif === "MEDIO" ? 1 : 0) +
    (imp === "ALTO" ? 2 : imp === "MEDIO" ? 1 : 0);
  if (score >= 3) return "border-red-200 bg-red-50";
  if (score === 2) return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
}

function NovaDemandaModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DemandaInput>({
    contaNome: "",
    titulo: "",
    descricao: "",
    dificuldade: "MEDIO",
    impacto: "MEDIO",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      await demandasService.create(form);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nova demanda">
      <div className="grid gap-3">
        <Field label="Título">
          <input
            className={inputCls}
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </Field>
        <Field label="Conta">
          <input
            className={inputCls}
            value={form.contaNome}
            onChange={(e) => setForm({ ...form, contaNome: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dificuldade">
            <select
              className={inputCls}
              value={form.dificuldade}
              onChange={(e) =>
                setForm({ ...form, dificuldade: e.target.value as Nivel })
              }
            >
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {NIVEL_LABEL[n]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impacto">
            <select
              className={inputCls}
              value={form.impacto}
              onChange={(e) =>
                setForm({ ...form, impacto: e.target.value as Nivel })
              }
            >
              {NIVEIS.map((n) => (
                <option key={n} value={n}>
                  {NIVEL_LABEL[n]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Descrição">
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !form.titulo.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- helpers ---------------- */

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ note }: { note: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {note}
    </div>
  );
}
