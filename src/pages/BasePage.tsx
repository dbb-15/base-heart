// #/base — Base Mestre: tabela densa de contas + busca/filtros + drawer nova financeira.
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { Drawer } from "../components/Drawer";
import { contasService } from "../services/contas";
import type { ContaInput, ListContasParams } from "../services/contas";
import { gruposService } from "../services/grupos";
import type { Conta, GrupoFinanceiro, Segmento, StatusConta } from "../types";
import { SEGMENTO_LABEL, STATUS_CONTA_LABEL } from "../labels";
import { formatCNPJ, formatDate } from "../format";
import { navigate } from "../hooks/useHashRoute";
import { ApiError } from "../services/api";

const STATUS: StatusConta[] = ["PROSPECT", "CLIENTE", "INATIVO"];
const SEGMENTOS: Segmento[] = [
  "BANCO",
  "FINANCEIRA",
  "COOPERATIVA",
  "CONSORCIO",
  "CONCESSIONARIA",
  "REVENDA",
  "OUTROS",
];

const STATUS_COLOR: Record<StatusConta, string> = {
  PROSPECT: "bg-sky-100 text-sky-800",
  CLIENTE: "bg-emerald-100 text-emerald-800",
  INATIVO: "bg-slate-200 text-slate-700",
};

export function BasePage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [grupos, setGrupos] = useState<GrupoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusConta | "">("");
  const [segmento, setSegmento] = useState<Segmento | "">("");
  const [grupoId, setGrupoId] = useState<string>("");
  const [drawer, setDrawer] = useState(false);

  const params = useMemo<ListContasParams>(
    () => ({
      search: search || undefined,
      status: status || undefined,
      segmento: segmento || undefined,
      grupoId: grupoId || undefined,
    }),
    [search, status, segmento, grupoId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([
        contasService.list(params),
        gruposService.list(),
      ]);
      setContas(c);
      setGrupos(g);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell>
      <PageHeader
        title="Base Mestre"
        description="Contas e financeiras cadastradas."
        actions={
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            + Nova Financeira
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
            Buscar
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Razão social, fantasia ou CNPJ…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as StatusConta | "")}
          options={[["", "Todos"], ...STATUS.map((s) => [s, STATUS_CONTA_LABEL[s]] as [string, string])]}
        />
        <FilterSelect
          label="Segmento"
          value={segmento}
          onChange={(v) => setSegmento(v as Segmento | "")}
          options={[["", "Todos"], ...SEGMENTOS.map((s) => [s, SEGMENTO_LABEL[s]] as [string, string])]}
        />
        <FilterSelect
          label="Grupo"
          value={grupoId}
          onChange={setGrupoId}
          options={[["", "Todos"], ...grupos.map((g) => [g.id, g.nome] as [string, string])]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Razão Social</th>
              <th className="px-3 py-2">CNPJ</th>
              <th className="px-3 py-2">Segmento</th>
              <th className="px-3 py-2">Grupo</th>
              <th className="px-3 py-2">UF</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Criada</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && contas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : contas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              contas.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t border-border hover:bg-muted/40"
                  onClick={() => navigate(`/contas/${c.id}`)}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">
                      {c.nomeFantasia || c.razaoSocial}
                    </div>
                    {c.nomeFantasia && c.razaoSocial ? (
                      <div className="text-xs text-muted-foreground">{c.razaoSocial}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatCNPJ(c.cnpj)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.segmento ? SEGMENTO_LABEL[c.segmento] : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.grupoNome ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.uf ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        c.status ? STATUS_COLOR[c.status] : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {c.status ? STATUS_CONTA_LABEL[c.status] : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(c.criadaEm)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-xs text-primary">Ver conta →</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NovaFinanceiraDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        grupos={grupos}
        onCreated={(c) => {
          setDrawer(false);
          navigate(`/contas/${c.id}`);
        }}
      />
    </PageShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="min-w-[140px]">
      <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function NovaFinanceiraDrawer({
  open,
  onClose,
  grupos,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  grupos: GrupoFinanceiro[];
  onCreated: (c: Conta) => void;
}) {
  const [form, setForm] = useState<ContaInput>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    status: "PROSPECT",
    segmento: "BANCO",
    grupoId: null,
    uf: "",
    municipio: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd<K extends keyof ContaInput>(k: K, v: ContaInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.razaoSocial.trim()) {
      setError("Razão social é obrigatória.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const c = await contasService.create({
        ...form,
        grupoId: form.grupoId || null,
      });
      onCreated(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao criar conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nova Financeira"
      subtitle="Cadastro inicial da conta na Base Mestre."
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Razão social *">
          <input
            value={form.razaoSocial}
            onChange={(e) => upd("razaoSocial", e.target.value)}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome fantasia">
            <input
              value={form.nomeFantasia ?? ""}
              onChange={(e) => upd("nomeFantasia", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="CNPJ">
            <input
              value={form.cnpj ?? ""}
              onChange={(e) => upd("cnpj", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => upd("status", e.target.value as StatusConta)}
              className="input"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONTA_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Segmento">
            <select
              value={form.segmento ?? ""}
              onChange={(e) => upd("segmento", e.target.value as Segmento)}
              className="input"
            >
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>
                  {SEGMENTO_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grupo">
            <select
              value={form.grupoId ?? ""}
              onChange={(e) => upd("grupoId", e.target.value || null)}
              className="input"
            >
              <option value="">— sem grupo —</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="UF">
            <input
              value={form.uf ?? ""}
              onChange={(e) => upd("uf", e.target.value.toUpperCase().slice(0, 2))}
              className="input"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Município">
              <input
                value={form.municipio ?? ""}
                onChange={(e) => upd("municipio", e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </div>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}
      .input:focus{box-shadow:0 0 0 2px rgba(59,130,246,0.25);}`}</style>
    </Drawer>
  );
}
