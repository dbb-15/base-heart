// Modal de desfecho — versão GENÉRICA (Camada 2).
// - 3 OutcomeCards (avança / continua / perda) por padrão.
// - Perda em 2 passos: card vermelho → MotivoPerdaSelect → confirmar.
// - Especializações (sondagem, negociação, follow, expansão) entram em camadas seguintes.
import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { OutcomeCard } from "./OutcomeCard";
import { MotivoPerdaSelect } from "./MotivoPerdaSelect";
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
  onApplied: () => void; // pai refaz refetch
}

interface Outcome {
  key: string;
  variant: "success" | "warn" | "danger";
  title: string;
  subtitle: string;
  resultado: "AVANCAR" | "PERMANECER" | "LOST";
  criarFollowUp?: boolean;
}

function outcomesFor(_acao: AcaoAtividade): Outcome[] {
  // Genérico Camada 2 — sempre 3 opções neutras.
  // Camadas seguintes substituem por textos/lógica específicos por ação.
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSelected(null);
    setMotivo("");
    setMotivoDetalhe("");
    setMotivoError(null);
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function submit(outcome: Outcome, extra?: Partial<AplicarDesfechoInput>) {
    setSubmitting(true);
    setError(null);
    try {
      await oportunidadesService.aplicarDesfecho(oportunidadeId, {
        atividadeId: atividade.id,
        resultado: outcome.resultado,
        criarFollowUp: outcome.criarFollowUp,
        ...extra,
      });
      reset();
      onApplied();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Falha ao aplicar desfecho.",
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
    submit(o);
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
    const label =
      MOTIVOS_PERDA.find((m) => m.value === motivo)?.label ?? motivo;
    const motivoPerda =
      motivo === "OUTRO" ? `Outro: ${motivoDetalhe.trim()}` : label;
    submit(selected, { motivoPerda });
  }

  const showingPerda = selected?.resultado === "LOST";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={atividade.titulo || "Concluir atividade"}
      subtitle={
        showingPerda
          ? "Informe o motivo da perda para registrar."
          : "Selecione o desfecho da atividade."
      }
      size="md"
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
      ) : (
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
      )}
    </Modal>
  );
}
