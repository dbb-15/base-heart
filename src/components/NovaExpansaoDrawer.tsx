// NovaExpansaoDrawer — busca conta CLIENTE, escolhe tipo (UF/VOLUME/Standby),
// cria oportunidade EXPANSAO em Mapeamento (ou Standby).
import { useEffect, useState } from "react";
import { Drawer } from "./Drawer";
import { contasService } from "../services/contas";
import { oportunidadesService } from "../services/oportunidades";
import { ApiError } from "../services/api";
import type { Conta, Produto, TipoExpansao } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NovaExpansaoDrawer({ open, onClose, onCreated }: Props) {
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState<Conta[]>([]);
  const [contaId, setContaId] = useState<string>("");
  const [produto, setProduto] = useState<Produto>("E_REGISTRO");
  const [tipo, setTipo] = useState<TipoExpansao | "MAPEAMENTO">("MAPEAMENTO");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    contasService
      .list({ status: "CLIENTE", search: search || undefined })
      .then((data) => {
        if (alive) setClientes(data);
      })
      .catch(() => alive && setClientes([]));
    return () => {
      alive = false;
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setContaId("");
      setProduto("E_REGISTRO");
      setTipo("MAPEAMENTO");
      setValor("");
      setMotivo("");
      setError(null);
    }
  }, [open]);

  async function submit() {
    if (!contaId) {
      setError("Selecione uma conta cliente.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const opp = await oportunidadesService.create({
        pipeline: "EXPANSAO",
        contaId,
        produto,
        tipoExpansao: tipo === "MAPEAMENTO" ? undefined : (tipo as TipoExpansao),
        motivo: motivo || undefined,
        valorEstimadoMensal: valor ? Number(valor) : undefined,
      });
      onCreated(opp.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao criar expansão.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nova expansão"
      subtitle="Busque uma conta CLIENTE e escolha o tipo de expansão."
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !contaId}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Criando…" : "Criar expansão"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Conta cliente
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CNPJ…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-border bg-background">
            {clientes.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Nenhuma conta CLIENTE encontrada.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {clientes.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                      <input
                        type="radio"
                        name="conta"
                        checked={contaId === c.id}
                        onChange={() => setContaId(c.id)}
                        className="mt-1"
                      />
                      <span className="flex-1">
                        <span className="block font-medium text-foreground">
                          {c.nomeFantasia || c.razaoSocial || c.id}
                        </span>
                        {c.cnpj ? (
                          <span className="text-[11px] text-muted-foreground">
                            {c.cnpj}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Produto
            </label>
            <select
              value={produto}
              onChange={(e) => setProduto(e.target.value as Produto)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="E_REGISTRO">e-Registro</option>
              <option value="E_BUSCAR">e-BusCar</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="MAPEAMENTO">Mapeamento (definir depois)</option>
              <option value="UF">Aumento de UF</option>
              <option value="VOLUME">Aumento de volume</option>
              <option value="STANDBY">Standby</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Valor mensal estimado (R$)
            </label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Motivo
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Nova UF, aumento de volume…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
