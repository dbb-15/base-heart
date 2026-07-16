// #/admin — Administração com abas Usuários | Registradoras.
// A rota #/admin/registradoras seleciona a segunda aba (mesma página).
import { useCallback, useEffect, useState } from "react";
import { PageHeader, PageShell } from "../components/PageShell";
import { Modal } from "../components/Modal";
import { Drawer } from "../components/Drawer";
import { Field } from "../components/Field";
import { navigate, useHashRoute } from "../hooks/useHashRoute";
import { usuariosService } from "../services/usuarios";
import type { UsuarioInput } from "../services/usuarios";
import { registradorasService } from "../services/registradoras";
import type { RegistradoraInput } from "../services/registradoras";
import type { Registradora, Role, Usuario } from "../types";
import { ROLE_LABEL } from "../labels";
import { formatCNPJ } from "../format";
import { ApiError } from "../services/api";

type Tab = "usuarios" | "registradoras";

const ROLES: Role[] = ["admin", "gestor", "operacoes", "corretor", "registradora"];

export function AdminPage() {
  const route = useHashRoute();
  const tab: Tab =
    route.path === "/admin/registradoras" ? "registradoras" : "usuarios";

  return (
    <PageShell>
      <PageHeader
        title="Administração"
        description="Usuários e registradoras do sistema."
      />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        <TabButton
          active={tab === "usuarios"}
          onClick={() => navigate("/admin")}
          label="Usuários"
        />
        <TabButton
          active={tab === "registradoras"}
          onClick={() => navigate("/admin/registradoras")}
          label="Registradoras"
        />
      </div>
      {tab === "usuarios" ? <UsuariosPanel /> : <RegistradorasPanel />}
    </PageShell>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// -------------------- USUÁRIOS --------------------

function UsuariosPanel() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Usuario | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usuariosService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAtivo(u: Usuario) {
    await usuariosService.setAtivo(u.id, !u.ativo);
    load();
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setModal("new")}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Novo usuário
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Perfil</th>
              <th className="px-3 py-2">Ativo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{u.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {ROLE_LABEL[u.role] ?? u.role}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        u.ativo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setModal(u)}
                      className="mr-3 text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAtivo(u)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {u.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <UsuarioModal
          usuario={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

function UsuarioModal({
  usuario,
  onClose,
  onSaved,
}: {
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UsuarioInput>({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    role: usuario?.role ?? "corretor",
    ativo: usuario?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!form.nome.trim() || !form.email.trim()) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      if (usuario) await usuariosService.update(usuario.id, form);
      else await usuariosService.create(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={usuario ? "Editar usuário" : "Novo usuário"}
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
            className="input"
          />
        </Field>
        <Field label="E-mail *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="input"
          />
        </Field>
        <Field label="Perfil">
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r] ?? r}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={!!form.ativo}
            onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
          />
          Usuário ativo
        </label>
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;}
      .input:focus{box-shadow:0 0 0 2px rgba(59,130,246,0.25);}`}</style>
    </Modal>
  );
}

// -------------------- REGISTRADORAS --------------------

function RegistradorasPanel() {
  const [items, setItems] = useState<Registradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<Registradora | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await registradorasService.list({ search: search || undefined }));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(r: Registradora) {
    if (!confirm(`Remover "${r.nome}"?`)) return;
    await registradorasService.remove(r.id);
    load();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[240px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CNPJ…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setDrawer("new")}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Nova registradora
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">CNPJ</th>
              <th className="px-3 py-2">Situação</th>
              <th className="px-3 py-2">UF</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma registradora encontrada.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{r.nome}</div>
                    {r.nomeEmpresarial ? (
                      <div className="text-xs text-muted-foreground">
                        {r.nomeEmpresarial}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatCNPJ(r.cnpj)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.situacaoCadastral ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.uf ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setDrawer(r)}
                      className="mr-3 text-xs text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r)}
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

      {drawer ? (
        <RegistradoraDrawer
          registradora={drawer === "new" ? null : drawer}
          onClose={() => setDrawer(null)}
          onSaved={() => {
            setDrawer(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

const EMPTY_REG: RegistradoraInput = {
  nome: "",
  nomeEmpresarial: "",
  cnpj: "",
  nomeFantasia: "",
  tipo: "MATRIZ",
  dataAbertura: "",
  porte: "",
  situacaoCadastral: "ATIVA",
  cnaePrincipalCodigo: "",
  cnaePrincipalDescricao: "",
  cnaesSecundarios: "",
  naturezaJuridicaCodigo: "",
  naturezaJuridicaDescricao: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  uf: "",
  email: "",
  telefone: "",
  dataSituacaoCadastral: "",
  motivoSituacaoCadastral: "",
  efr: "",
  situacaoEspecial: "",
  dataSituacaoEspecial: "",
};

function fromRegistradora(r: Registradora): RegistradoraInput {
  const o = { ...EMPTY_REG, nome: r.nome };
  for (const key of Object.keys(EMPTY_REG) as (keyof RegistradoraInput)[]) {
    const v = (r as unknown as Record<string, unknown>)[key];
    if (typeof v === "string") (o as Record<string, unknown>)[key] = v;
  }
  return o;
}

function RegistradoraDrawer({
  registradora,
  onClose,
  onSaved,
}: {
  registradora: Registradora | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<RegistradoraInput>(
    registradora ? fromRegistradora(registradora) : { ...EMPTY_REG },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  function upd<K extends keyof RegistradoraInput>(k: K, v: RegistradoraInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function buscarCep() {
    const cep = (form.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean;
      };
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        municipio: data.localidade || f.municipio,
        uf: data.uf || f.uf,
      }));
    } catch {
      // silencioso
    } finally {
      setCepLoading(false);
    }
  }

  async function submit() {
    if (!form.cnpj?.trim() || !form.nomeEmpresarial?.trim()) {
      setError("CNPJ e nome empresarial são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: RegistradoraInput = {
        ...form,
        nome: form.nome?.trim() || form.nomeFantasia?.trim() || form.nomeEmpresarial,
      };
      if (registradora) await registradorasService.update(registradora.id, payload);
      else await registradorasService.create(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar registradora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={registradora ? "Editar registradora" : "Nova registradora"}
      subtitle="Cadastro CNPJ completo — usado pelo picker de sondagem."
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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
      <div className="space-y-5 text-sm">
        <Section title="Identificação">
          <Field label="CNPJ *">
            <input value={form.cnpj ?? ""} onChange={(e) => upd("cnpj", e.target.value)} className="input" />
          </Field>
          <Field label="Nome empresarial *">
            <input value={form.nomeEmpresarial ?? ""} onChange={(e) => upd("nomeEmpresarial", e.target.value)} className="input" />
          </Field>
          <Field label="Nome de fantasia">
            <input value={form.nomeFantasia ?? ""} onChange={(e) => upd("nomeFantasia", e.target.value)} className="input" />
          </Field>
          <Field label="Nome curto (exibição)">
            <input value={form.nome ?? ""} onChange={(e) => upd("nome", e.target.value)} className="input" placeholder="Ex.: CRA-SP" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tipo">
              <select
                value={form.tipo ?? "MATRIZ"}
                onChange={(e) => upd("tipo", e.target.value as "MATRIZ" | "FILIAL")}
                className="input"
              >
                <option value="MATRIZ">Matriz</option>
                <option value="FILIAL">Filial</option>
              </select>
            </Field>
            <Field label="Data de abertura">
              <input type="date" value={form.dataAbertura ?? ""} onChange={(e) => upd("dataAbertura", e.target.value)} className="input" />
            </Field>
            <Field label="Porte">
              <input value={form.porte ?? ""} onChange={(e) => upd("porte", e.target.value)} className="input" placeholder="DEMAIS / ME / EPP" />
            </Field>
          </div>
          <Field label="Situação cadastral">
            <input value={form.situacaoCadastral ?? ""} onChange={(e) => upd("situacaoCadastral", e.target.value)} className="input" />
          </Field>
        </Section>

        <Section title="Atividade econômica / natureza">
          <div className="grid grid-cols-3 gap-3">
            <Field label="CNAE principal — código">
              <input value={form.cnaePrincipalCodigo ?? ""} onChange={(e) => upd("cnaePrincipalCodigo", e.target.value)} className="input" />
            </Field>
            <div className="col-span-2">
              <Field label="CNAE principal — descrição">
                <input value={form.cnaePrincipalDescricao ?? ""} onChange={(e) => upd("cnaePrincipalDescricao", e.target.value)} className="input" />
              </Field>
            </div>
          </div>
          <Field label="CNAEs secundários">
            <textarea
              rows={3}
              value={form.cnaesSecundarios ?? ""}
              onChange={(e) => upd("cnaesSecundarios", e.target.value)}
              className="input"
              placeholder="Uma por linha: código - descrição"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Natureza jurídica — código">
              <input value={form.naturezaJuridicaCodigo ?? ""} onChange={(e) => upd("naturezaJuridicaCodigo", e.target.value)} className="input" />
            </Field>
            <div className="col-span-2">
              <Field label="Natureza jurídica — descrição">
                <input value={form.naturezaJuridicaDescricao ?? ""} onChange={(e) => upd("naturezaJuridicaDescricao", e.target.value)} className="input" />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Endereço e contato">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <Field label="CEP">
                <div className="flex gap-2">
                  <input
                    value={form.cep ?? ""}
                    onChange={(e) => upd("cep", e.target.value)}
                    onBlur={buscarCep}
                    className="input"
                    placeholder="00000-000"
                  />
                </div>
              </Field>
            </div>
            <div className="col-span-3 flex items-end">
              {cepLoading ? (
                <span className="text-xs text-muted-foreground">Buscando ViaCEP…</span>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-4">
              <Field label="Logradouro">
                <input value={form.logradouro ?? ""} onChange={(e) => upd("logradouro", e.target.value)} className="input" />
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="Número">
                <input value={form.numero ?? ""} onChange={(e) => upd("numero", e.target.value)} className="input" />
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="Complemento">
                <input value={form.complemento ?? ""} onChange={(e) => upd("complemento", e.target.value)} className="input" />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-2">
              <Field label="Bairro">
                <input value={form.bairro ?? ""} onChange={(e) => upd("bairro", e.target.value)} className="input" />
              </Field>
            </div>
            <div className="col-span-3">
              <Field label="Município">
                <input value={form.municipio ?? ""} onChange={(e) => upd("municipio", e.target.value)} className="input" />
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="UF">
                <input
                  value={form.uf ?? ""}
                  onChange={(e) => upd("uf", e.target.value.toUpperCase().slice(0, 2))}
                  className="input"
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <input type="email" value={form.email ?? ""} onChange={(e) => upd("email", e.target.value)} className="input" />
            </Field>
            <Field label="Telefone">
              <input value={form.telefone ?? ""} onChange={(e) => upd("telefone", e.target.value)} className="input" />
            </Field>
          </div>
        </Section>

        <Section title="Situação cadastral (extra)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data da situação cadastral">
              <input type="date" value={form.dataSituacaoCadastral ?? ""} onChange={(e) => upd("dataSituacaoCadastral", e.target.value)} className="input" />
            </Field>
            <Field label="Motivo da situação cadastral">
              <input value={form.motivoSituacaoCadastral ?? ""} onChange={(e) => upd("motivoSituacaoCadastral", e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Ente federativo responsável (EFR)">
            <input value={form.efr ?? ""} onChange={(e) => upd("efr", e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Situação especial">
              <input value={form.situacaoEspecial ?? ""} onChange={(e) => upd("situacaoEspecial", e.target.value)} className="input" />
            </Field>
            <Field label="Data da situação especial">
              <input type="date" value={form.dataSituacaoEspecial ?? ""} onChange={(e) => upd("dataSituacaoEspecial", e.target.value)} className="input" />
            </Field>
          </div>
        </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
