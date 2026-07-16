// Modal de desfecho — Camada 3: especializações críticas.
// Regras:
// - DESFECHO_NEGOCIACAO: Aprovou/Continua → PERMANECER + criarFollowNegociacao + dataRetorno.
//   NUNCA AVANCAR. Sem fit → LOST.
// - DESFECHO_FOLLOW_NEGOCIACAO: Aprovou → AVANCAR. Continua → novo follow + data.
//   metadata.acao no follow.
// - DESFECHO_DEMO: form de sondagem (volume, registradoras, integração, valor,
//   estados, diferenciais + "não informado") + Quer proposta / Sem interesse.
// - DESFECHO_RECUPERACAO_LEAD: Reativou / Ainda tentando / Sem interesse.
// - DESFECHO_CONFIRMACAO_INICIO_REGISTROS: Sim → AVANCAR (backend fecha Won).
import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { OutcomeCard } from "./OutcomeCard";
import { MotivoPerdaSelect } from "./MotivoPerdaSelect";
import { RegistradorasPicker } from "./RegistradorasPicker";
import type { AcaoAtividade, AtividadeListItem } from "../types";
import { oportunidadesService } from "../services/oportunidades";
import type { AplicarDesfechoInput } from "../services/oportunidades";
import { ApiError } from "../services/api";
import { MOTIVOS_PERDA } from "../domain";

interface Props {
  open: boolean;
  onClose: () => void;
  oportunidadeId: string;
  atividade: AtividadeListItem;
  acao: AcaoAtividade;
  onApplied: () => void;
}

type OutcomeKey =
  | "avancar" | "follow" | "perda"
  | "neg_aprovou" | "neg_continua" | "neg_sem_fit"
  | "fneg_aprovou" | "fneg_continua" | "fneg_sem_fit"
  | "sond_proposta" | "sond_sem_interesse"
  | "rec_reativou" | "rec_tentando" | "rec_sem_interesse"
  | "reg_sim" | "reg_ainda_nao"
  // expansão — sondagem
  | "sondexp_uf" | "sondexp_volume" | "sondexp_standby"
  // expansão — abordagem volume
  | "abv_reuniao" | "abv_manter" | "abv_standby"
  // expansão — reunião volume
  | "rev_realizada" | "rev_remarcar" | "rev_standby"
  // expansão — standby
  | "stb_recuperou" | "stb_em_contato" | "stb_manter"
  // conferir UFs
  | "ufs_confirmar";

interface Outcome {
  key: OutcomeKey;
  variant: "success" | "primary" | "warn" | "danger";
  title: string;
  subtitle: string;
  resultado: "AVANCAR" | "PERMANECER" | "LOST";
  requiresDate?: boolean;
  requiresUfs?: boolean;
  criarFollowNegociacao?: boolean;
  criarFollowUp?: boolean;
  metadata?: Record<string, unknown>;
}

function outcomesFor(acao: AcaoAtividade): Outcome[] {
  switch (acao) {
    case "DESFECHO_NEGOCIACAO":
      return [
        {
          key: "neg_aprovou",
          variant: "success",
          title: "Cliente aprovou condições",
          subtitle: "Agenda follow-up de negociação com data de retorno",
          resultado: "PERMANECER",
          requiresDate: true,
          criarFollowNegociacao: true,
          metadata: {
            acao: "DESFECHO_FOLLOW_NEGOCIACAO",
            negociacaoResultado: "APROVOU",
          },
        },
        {
          key: "neg_continua",
          variant: "warn",
          title: "Continua negociando",
          subtitle: "Agenda follow-up de negociação com data de retorno",
          resultado: "PERMANECER",
          requiresDate: true,
          criarFollowNegociacao: true,
          metadata: {
            acao: "DESFECHO_FOLLOW_NEGOCIACAO",
            negociacaoResultado: "CONTINUA",
          },
        },
        {
          key: "neg_sem_fit",
          variant: "danger",
          title: "Sem fit / recusou",
          subtitle: "Registrar perda com motivo",
          resultado: "LOST",
        },
      ];
    case "DESFECHO_FOLLOW_NEGOCIACAO":
      return [
        {
          key: "fneg_aprovou",
          variant: "success",
          title: "Cliente aprovou",
          subtitle: "Avançar para Fechamento",
          resultado: "AVANCAR",
          metadata: { negociacaoResultado: "APROVOU" },
        },
        {
          key: "fneg_continua",
          variant: "warn",
          title: "Continua negociando",
          subtitle: "Agenda novo follow-up com data",
          resultado: "PERMANECER",
          requiresDate: true,
          criarFollowNegociacao: true,
          metadata: {
            acao: "DESFECHO_FOLLOW_NEGOCIACAO",
            negociacaoResultado: "CONTINUA",
          },
        },
        {
          key: "fneg_sem_fit",
          variant: "danger",
          title: "Sem fit / recusou",
          subtitle: "Registrar perda com motivo",
          resultado: "LOST",
        },
      ];
    case "DESFECHO_DEMO":
      return [
        {
          key: "sond_proposta",
          variant: "success",
          title: "Cliente quer proposta",
          subtitle: "Avançar para Proposta",
          resultado: "AVANCAR",
        },
        {
          key: "sond_sem_interesse",
          variant: "danger",
          title: "Sem interesse após sondagem",
          subtitle: "Registrar perda com motivo",
          resultado: "LOST",
        },
      ];
    case "DESFECHO_RECUPERACAO_LEAD":
      return [
        {
          key: "rec_reativou",
          variant: "success",
          title: "Lead reativou",
          subtitle: "Reabre no próximo estágio após o da perda",
          resultado: "AVANCAR",
        },
        {
          key: "rec_tentando",
          variant: "warn",
          title: "Ainda tentando",
          subtitle: "Permanece perdida + novo follow de recuperação",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
        {
          key: "rec_sem_interesse",
          variant: "danger",
          title: "Sem interesse",
          subtitle: "Permanece perdida (definitivo)",
          resultado: "LOST",
        },
      ];
    case "DESFECHO_CONFIRMACAO_INICIO_REGISTROS":
      return [
        {
          key: "reg_sim",
          variant: "success",
          title: "Sim, cliente iniciou registros",
          subtitle: "Fecha oportunidade como ganha",
          resultado: "AVANCAR",
          metadata: { iniciouRegistros: true },
        },
        {
          key: "reg_ainda_nao",
          variant: "warn",
          title: "Ainda não / reagendar",
          subtitle: "Cria novo acompanhamento",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
      ];
    case "DESFECHO_SONDAGEM_EXPANSAO":
      return [
        {
          key: "sondexp_uf",
          variant: "success",
          title: "Ramo: Aumento de UF",
          subtitle: "Move para Proposta (UF)",
          resultado: "PERMANECER",
          metadata: { tipoExpansao: "UF" },
        },
        {
          key: "sondexp_volume",
          variant: "primary",
          title: "Ramo: Aumento de Volume",
          subtitle: "Move para Sem contato (Volume)",
          resultado: "PERMANECER",
          metadata: { tipoExpansao: "VOLUME" },
        },
        {
          key: "sondexp_standby",
          variant: "warn",
          title: "Standby",
          subtitle: "Sem oportunidade agora — retoma em D+30",
          resultado: "PERMANECER",
          criarFollowUp: true,
          metadata: { tipoExpansao: "STANDBY" },
        },
      ];
    case "DESFECHO_ABORDAGEM_VOLUME":
      return [
        {
          key: "abv_reuniao",
          variant: "success",
          title: "Marcar reunião",
          subtitle: "Avança para Em contato / agenda reunião",
          resultado: "AVANCAR",
        },
        {
          key: "abv_manter",
          variant: "warn",
          title: "Manter contato",
          subtitle: "Cria novo follow-up de abordagem",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
        {
          key: "abv_standby",
          variant: "warn",
          title: "Standby",
          subtitle: "Sem interesse imediato — retoma depois",
          resultado: "PERMANECER",
          metadata: { moverParaStandby: true },
        },
      ];
    case "DESFECHO_REUNIAO_VOLUME":
      return [
        {
          key: "rev_realizada",
          variant: "success",
          title: "Reunião realizada",
          subtitle: "Avança para Negociando",
          resultado: "AVANCAR",
        },
        {
          key: "rev_remarcar",
          variant: "warn",
          title: "Remarcar",
          subtitle: "Agenda nova reunião",
          resultado: "PERMANECER",
          requiresDate: true,
          criarFollowUp: true,
        },
        {
          key: "rev_standby",
          variant: "warn",
          title: "Standby",
          subtitle: "Sem interesse agora",
          resultado: "PERMANECER",
          metadata: { moverParaStandby: true },
        },
      ];
    case "DESFECHO_STANDBY_EXPANSAO":
      return [
        {
          key: "stb_recuperou",
          variant: "success",
          title: "Cliente recuperado",
          subtitle: "Reabre expansão a partir de Mapeamento",
          resultado: "AVANCAR",
        },
        {
          key: "stb_em_contato",
          variant: "warn",
          title: "Em contato",
          subtitle: "Retomou conversa — cria follow-up",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
        {
          key: "stb_manter",
          variant: "warn",
          title: "Manter standby",
          subtitle: "Sem movimento — novo follow em D+30",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
      ];
    case "CONFERIR_UFS_EXPANSAO":
      return [
        {
          key: "ufs_confirmar",
          variant: "success",
          title: "Confirmar UFs realizadas",
          subtitle: "Selecione as UFs e avance de estágio",
          resultado: "AVANCAR",
          requiresUfs: true,
        },
      ];
    default:
      return [
        {
          key: "avancar",
          variant: "success",
          title: "Resultado positivo",
          subtitle: "Concluir e avançar no funil",
          resultado: "AVANCAR",
        },
        {
          key: "follow",
          variant: "warn",
          title: "Ainda tentando",
          subtitle: "Manter no estágio e criar follow-up",
          resultado: "PERMANECER",
          criarFollowUp: true,
        },
        {
          key: "perda",
          variant: "danger",
          title: "Sem interesse",
          subtitle: "Registrar perda com motivo",
          resultado: "LOST",
        },
      ];
  }
}

interface SondagemState {
  volumeEstimado: string;
  volumeNaoInformado: boolean;
  registradoraIds: string[];
  registradorasNomes: string[];
  registradorasNaoInformado: boolean;
  integracao: "" | "SIM" | "NAO";
  integracaoNaoInformado: boolean;
  valorEstimadoMensal: string;
  semEstimativaValor: boolean;
  estados: string;
  diferenciais: string;
}

const SONDAGEM_INICIAL: SondagemState = {
  volumeEstimado: "",
  volumeNaoInformado: false,
  registradoraIds: [],
  registradorasNomes: [],
  registradorasNaoInformado: false,
  integracao: "",
  integracaoNaoInformado: false,
  valorEstimadoMensal: "",
  semEstimativaValor: false,
  estados: "",
  diferenciais: "",
};

export function DesfechoAtividadeModal({
  open,
  onClose,
  oportunidadeId,
  atividade,
  acao,
  onApplied,
}: Props) {
  const outcomes = useMemo(() => outcomesFor(acao), [acao]);
  const [selected, setSelected] = useState<Outcome | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoDetalhe, setMotivoDetalhe] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);
  const [dataRetorno, setDataRetorno] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [sondagem, setSondagem] = useState<SondagemState>(SONDAGEM_INICIAL);
  const [ufsSel, setUfsSel] = useState<string[]>([]);
  const [ufsError, setUfsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSondagem = acao === "DESFECHO_DEMO";

  function reset() {
    setSelected(null);
    setMotivo("");
    setMotivoDetalhe("");
    setMotivoError(null);
    setDataRetorno("");
    setDataError(null);
    setSondagem(SONDAGEM_INICIAL);
    setUfsSel([]);
    setUfsError(null);
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function submit(
    outcome: Outcome,
    extra?: Partial<AplicarDesfechoInput>,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const payload: AplicarDesfechoInput = {
        atividadeId: atividade.id,
        resultado: outcome.resultado,
        criarFollowUp: outcome.criarFollowUp,
        criarFollowNegociacao: outcome.criarFollowNegociacao,
        metadata: outcome.metadata,
        ...extra,
      };
      await oportunidadesService.aplicarDesfecho(oportunidadeId, payload);
      reset();
      onApplied();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao aplicar desfecho.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handlePick(o: Outcome) {
    if (o.resultado === "LOST") {
      setSelected(o);
      return;
    }
    if (o.requiresDate || o.requiresUfs) {
      setSelected(o);
      return;
    }
    submit(o, isSondagem ? { dadosQualificacao: buildSondagemPayload() } : undefined);
  }

  function confirmarComUfs() {
    if (!selected) return;
    if (ufsSel.length === 0) {
      setUfsError("Selecione ao menos uma UF.");
      return;
    }
    setUfsError(null);
    submit(selected, {
      dadosQualificacao: { ufsRealizadas: ufsSel, ufsNegociadas: ufsSel },
    });
  }

  function buildSondagemPayload(): Record<string, unknown> {
    const ufs = sondagem.estados
      .split(/[,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return {
      volumeEstimado: sondagem.volumeNaoInformado ? null : sondagem.volumeEstimado,
      volumeEstimadoNaoInformado: sondagem.volumeNaoInformado,
      registradoraIds: sondagem.registradorasNaoInformado ? [] : sondagem.registradoraIds,
      registradoras: sondagem.registradorasNaoInformado ? [] : sondagem.registradorasNomes,
      registradorasNaoInformado: sondagem.registradorasNaoInformado,
      integracao: sondagem.integracaoNaoInformado ? null : sondagem.integracao || null,
      integracaoNaoInformado: sondagem.integracaoNaoInformado,
      valorEstimadoMensal: sondagem.semEstimativaValor
        ? null
        : Number(sondagem.valorEstimadoMensal || 0) || null,
      semEstimativaValor: sondagem.semEstimativaValor,
      estados: ufs,
      ufsNegociadas: ufs,
      diferenciais: sondagem.diferenciais || null,
    };
  }

  function confirmarComData() {
    if (!selected) return;
    if (!dataRetorno) {
      setDataError("Informe a data de retorno.");
      return;
    }
    setDataError(null);
    const iso = new Date(dataRetorno + "T09:00:00").toISOString();
    submit(selected, { dataRetorno: iso });
  }

  function confirmarPerda() {
    if (!selected) return;
    if (!motivo) {
      setMotivoError("Selecione o motivo.");
      return;
    }
    if (motivo === "OUTRO" && !motivoDetalhe.trim()) {
      setMotivoError("Descreva o motivo quando selecionar Outro.");
      return;
    }
    setMotivoError(null);
    const label = MOTIVOS_PERDA.find((m) => m.value === motivo)?.label ?? motivo;
    const motivoPerda =
      motivo === "OUTRO" ? `Outro: ${motivoDetalhe.trim()}` : label;
    submit(selected, { motivoPerda });
  }

  const showingPerda = selected?.resultado === "LOST";
  const showingData = !!selected && selected.requiresDate;
  const showingUfs = !!selected && selected.requiresUfs;

  const subtitle = showingPerda
    ? "Informe o motivo da perda para registrar."
    : showingData
      ? "Escolha a data de retorno para o follow-up."
      : showingUfs
        ? "Selecione as UFs realizadas."
        : isSondagem
          ? "Preencha os dados da sondagem e escolha o desfecho."
          : "Selecione o desfecho da atividade.";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={atividade.titulo || "Concluir atividade"}
      subtitle={subtitle}
      size={isSondagem ? "lg" : "md"}
      footer={
        showingPerda ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setMotivoError(null);
                setError(null);
              }}
              disabled={submitting}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={confirmarPerda}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? "Registrando…" : "Confirmar perda"}
            </button>
          </>
        ) : showingData ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setDataError(null);
                setError(null);
              }}
              disabled={submitting}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={confirmarComData}
              disabled={submitting}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Confirmar"}
            </button>
          </>
        ) : showingUfs ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setUfsError(null);
                setError(null);
              }}
              disabled={submitting}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={confirmarComUfs}
              disabled={submitting}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Confirmar"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            Cancelar
          </button>
        )
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showingPerda ? (
        <MotivoPerdaSelect
          value={motivo}
          detalhe={motivoDetalhe}
          onChange={(v, d) => {
            setMotivo(v);
            setMotivoDetalhe(d);
          }}
          error={motivoError}
        />
      ) : showingData ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {selected?.title} — {selected?.subtitle}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Data de retorno
            </label>
            <input
              type="date"
              value={dataRetorno}
              onChange={(e) => setDataRetorno(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {dataError ? (
              <p className="mt-1 text-xs text-destructive">{dataError}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isSondagem ? (
            <SondagemForm value={sondagem} onChange={setSondagem} disabled={submitting} />
          ) : null}
          <div className="flex flex-col gap-2">
            {outcomes.map((o) => (
              <OutcomeCard
                key={o.key}
                variant={o.variant}
                title={o.title}
                subtitle={o.subtitle}
                disabled={submitting}
                onClick={() => handlePick(o)}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function SondagemForm({
  value,
  onChange,
  disabled,
}: {
  value: SondagemState;
  onChange: (v: SondagemState) => void;
  disabled?: boolean;
}) {
  function patch(p: Partial<SondagemState>) {
    onChange({ ...value, ...p });
  }
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-2">
      <Field
        label="Volume mensal (registros)"
        naoInformadoLabel="Sem estimativa"
        naoInformado={value.volumeNaoInformado}
        onNaoInformado={(v) => patch({ volumeNaoInformado: v })}
      >
        <input
          type="text"
          inputMode="numeric"
          value={value.volumeEstimado}
          onChange={(e) => patch({ volumeEstimado: e.target.value })}
          disabled={disabled || value.volumeNaoInformado}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field
        label="Valor mensal estimado (R$)"
        naoInformadoLabel="Sem estimativa"
        naoInformado={value.semEstimativaValor}
        onNaoInformado={(v) => patch({ semEstimativaValor: v })}
      >
        <input
          type="number"
          value={value.valorEstimadoMensal}
          onChange={(e) => patch({ valorEstimadoMensal: e.target.value })}
          disabled={disabled || value.semEstimativaValor}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field
        label="Utiliza integração?"
        naoInformadoLabel="Não informado"
        naoInformado={value.integracaoNaoInformado}
        onNaoInformado={(v) => patch({ integracaoNaoInformado: v })}
      >
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(["SIM", "NAO"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled || value.integracaoNaoInformado}
              onClick={() => patch({ integracao: opt })}
              className={`px-3 py-1.5 text-sm ${
                value.integracao === opt
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {opt === "SIM" ? "Sim" : "Não"}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Estados (UFs, separadas por vírgula)
        </label>
        <input
          type="text"
          value={value.estados}
          onChange={(e) => patch({ estados: e.target.value })}
          disabled={disabled}
          placeholder="SP, RJ, MG"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <RegistradorasPicker
          selectedIds={value.registradoraIds}
          onChange={(ids, nomes) =>
            patch({ registradoraIds: ids, registradorasNomes: nomes })
          }
          naoInformado={value.registradorasNaoInformado}
          onNaoInformadoChange={(v) => patch({ registradorasNaoInformado: v })}
          disabled={disabled}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-foreground">
          Diferenciais
        </label>
        <textarea
          value={value.diferenciais}
          onChange={(e) => patch({ diferenciais: e.target.value })}
          disabled={disabled}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  naoInformadoLabel,
  naoInformado,
  onNaoInformado,
  children,
}: {
  label: string;
  naoInformadoLabel: string;
  naoInformado: boolean;
  onNaoInformado: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={naoInformado}
            onChange={(e) => onNaoInformado(e.target.checked)}
          />
          {naoInformadoLabel}
        </label>
      </div>
      {children}
    </div>
  );
}
