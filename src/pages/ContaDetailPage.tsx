// #/contas/:id — página da conta com abas Resumo, Contatos, Oportunidades, Produtos, Atividades.
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { matchRoute, navigate, useHashRoute } from "../hooks/useHashRoute";
import { Drawer } from "../components/Drawer";
import { Field } from "../components/Field";
import { contasService } from "../services/contas";
import { contatosService } from "../services/contatos";
import type { ContatoInput } from "../services/contatos";
import { oportunidadesService } from "../services/oportunidades";
import { atividadesService } from "../services/atividades";
import type {
  AtividadeListItem,
  Conta,
  Contato,
  OportunidadeListItem,
} from "../types";
import { STATUS_CONTA_LABEL, SEGMENTO_LABEL } from "../labels";
import { formatCNPJ, formatDate, formatDateTime, formatBRL } from "../format";
import { estagioLabel } from "../domain";
import { ApiError } from "../services/api";

type Tab = "resumo" | "contatos" | "oportunidades" | "produtos" | "atividades";

export function ContaDetailPage() {
  const route = useHashRoute();
  const params = matchRoute("/contas/:id", route);
  const id = params?.id ?? "";

  const [conta, setConta] = useState<Conta | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [opps, setOpps] = useState<OportunidadeListItem[]>([]);
  const [ativ, setAtiv] = useState<AtividadeListItem[]>([]);
  const [tab, setTab] = useState<Tab>("resumo");
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState<Contato | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [c, ct, os, at] = await Promise.all([
        contasService.get(id),
        contatosService.list(id),
        oportunidadesService.list({ contaId: id }).catch(() => []),
        atividadesService.list({ contaId: id }).catch(() => []),
      ]);
      setConta(c);
      setContatos(ct);
      setOpps(os.filter((o) => o.contaId === id));
      setAtiv(Array.isArray(at) ? at : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar conta.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const titulo = conta?.nomeFantasia || conta?.razaoSocial || "Conta";

  return (
    <PageShell>
      <PageHeader
        title={titulo}
        description={
          conta
            ? `${conta.razaoSocial ?? ""}${conta.cnpj ? ` • ${formatCNPJ(conta.cnpj)}` : ""}`
            : `ID: ${id}`
        }
        actions={
          <button
            type="button"
            onClick={() => navigate("/base")}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted"
          >
            ← Base
          </button>
        }
      />

      {error ? (
        <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-1 border-b border-border">
        {(
          [
            ["resumo", "Resumo"],
            ["contatos", `Contatos (${contatos.length})`],
            ["oportunidades", `Oportunidades (${opps.length})`],
            ["produtos", "Produtos"],
            ["atividades", "Atividades"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "resumo" && conta ? <ResumoTab conta={conta} /> : null}

      {tab === "contatos" ? (
        <ContatosTab
          contatos={contatos}
          onNovo={() => {
            setEditing(null);
            setDrawer(true);
          }}
          onEditar={(c) => {
            setEditing(c);
            setDrawer(true);
          }}
        />
      ) : null}

      {tab === "oportunidades" ? <OpsTab opps={opps} /> : null}

      {tab === "produtos" ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Produtos contratados serão listados aqui.
        </div>
      ) : null}

      {tab === "atividades" ? <AtvTab items={ativ} /> : null}

      <ContatoDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        contaId={id}
        contato={editing}
        onSaved={() => {
          setDrawer(false);
          load();
        }}
      />
    </PageShell>
  );
}

function ResumoTab({ conta }: { conta: Conta }) {
  const rows: [string, string][] = [
    ["Razão social", conta.razaoSocial ?? "—"],
    ["Nome fantasia", conta.nomeFantasia ?? "—"],
    ["CNPJ", formatCNPJ(conta.cnpj)],
    ["Status", conta.status ? STATUS_CONTA_LABEL[conta.status] : "—"],
    ["Segmento", conta.segmento ? SEGMENTO_LABEL[conta.segmento] : "—"],
    ["Grupo", conta.grupoNome ?? "—"],
    ["UF / Município", `${conta.uf ?? "—"} / ${conta.municipio ?? "—"}`],
    ["Owner", conta.ownerNome ?? "—"],
    ["Criada em", formatDate(conta.criadaEm)],
  ];
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-border bg-card px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
          <dd className="text-sm text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ContatosTab({
  contatos,
  onNovo,
  onEditar,
}: {
  contatos: Contato[];
  onNovo: () => void;
  onEditar: (c: Contato) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onNovo}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          + Novo contato
        </button>
      </div>
      {contatos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum contato cadastrado.
        </div>
      ) : (
        <ul className="space-y-2">
          {contatos.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  {c.principal ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Principal
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[c.cargo, c.email, c.telefone].filter(Boolean).join(" • ") || "—"}
                </p>
                {c.anotacoes ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {c.anotacoes}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onEditar(c)}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpsTab({ opps }: { opps: OportunidadeListItem[] }) {
  if (opps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhuma oportunidade nesta conta.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {opps.map((o) => (
        <li
          key={o.id}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-3 py-3 hover:bg-muted/40"
          onClick={() => navigate(`/oportunidades/${o.id}`)}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {o.pipeline}
              </span>
              <p className="text-sm font-medium text-foreground">
                {estagioLabel(o.estagio)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {o.produto ?? "—"} • {formatBRL(o.valorEstimadoMensal ?? undefined)}
            </p>
          </div>
          <span className="text-xs text-primary">Abrir →</span>
        </li>
      ))}
    </ul>
  );
}

function AtvTab({ items }: { items: AtividadeListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Sem atividades vinculadas.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="rounded-lg border border-border bg-card px-3 py-3">
          <p className="text-sm text-foreground">{a.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {a.tipo} • {formatDateTime(a.dataHora)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function ContatoDrawer({
  open,
  onClose,
  contaId,
  contato,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  contaId: string;
  contato: Contato | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ContatoInput>({
    nome: "",
    cargo: "",
    email: "",
    telefone: "",
    principal: false,
    anotacoes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        contato
          ? {
              nome: contato.nome,
              cargo: contato.cargo ?? "",
              email: contato.email ?? "",
              telefone: contato.telefone ?? "",
              principal: !!contato.principal,
              anotacoes: contato.anotacoes ?? "",
            }
          : {
              nome: "",
              cargo: "",
              email: "",
              telefone: "",
              principal: false,
              anotacoes: "",
            },
      );
    }
  }, [open, contato]);

  function upd<K extends keyof ContatoInput>(k: K, v: ContatoInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.nome.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      if (contato) await contatosService.update(contato.id, form);
      else await contatosService.create(contaId, form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar contato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={contato ? "Editar contato" : "Novo contato"}
      subtitle="Anotações da criação viram nota vinculada ao contato (quando ligado a uma oportunidade)."
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
        <Field label="Nome *">
          <input
            value={form.nome}
            onChange={(e) => upd("nome", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cargo">
            <input
              value={form.cargo ?? ""}
              onChange={(e) => upd("cargo", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
          <Field label="Telefone">
            <input
              value={form.telefone ?? ""}
              onChange={(e) => upd("telefone", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
        </div>
        <Field label="E-mail">
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => upd("email", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={!!form.principal}
            onChange={(e) => upd("principal", e.target.checked)}
          />
          Contato principal
        </label>
        <Field label="Anotações">
          <textarea
            rows={4}
            value={form.anotacoes ?? ""}
            onChange={(e) => upd("anotacoes", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
