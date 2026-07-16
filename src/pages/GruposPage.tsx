// #/grupos — CRUD simples de grupos financeiros.
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { gruposService } from "../services/grupos";
import type { GrupoInput } from "../services/grupos";
import type { GrupoFinanceiro } from "../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { ApiError } from "../services/api";

export function GruposPage() {
  const [grupos, setGrupos] = useState<GrupoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<GrupoFinanceiro | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGrupos(await gruposService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Remover grupo?")) return;
    await gruposService.remove(id);
    await load();
  }

  return (
    <PageShell>
      <PageHeader
        title="Grupos"
        description="Agrupamentos de contas financeiras."
        actions={
          <button
            type="button"
            onClick={() => setModal("new")}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            + Novo grupo
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Contas</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : grupos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum grupo cadastrado.
                </td>
              </tr>
            ) : (
              grupos.map((g) => (
                <tr key={g.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{g.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.descricao ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.totalContas ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setModal(g)}
                      className="mr-2 text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(g.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <GrupoModal
          grupo={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      ) : null}
    </PageShell>
  );
}

function GrupoModal({
  grupo,
  onClose,
  onSaved,
}: {
  grupo: GrupoFinanceiro | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<GrupoInput>({
    nome: grupo?.nome ?? "",
    descricao: grupo?.descricao ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!form.nome.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      if (grupo) await gruposService.update(grupo.id, form);
      else await gruposService.create(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar grupo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={grupo ? "Editar grupo" : "Novo grupo"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            rows={3}
            value={form.descricao ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
