// Regras puras do domínio (não bate na API).
// resolveAcaoAtividade: metadata.acao > heurística título > templateItem.acao > NENHUMA
import type { AcaoAtividade, AtividadeListItem } from "./types";

export const MOTIVOS_PERDA: { value: string; label: string }[] = [
  {
    value: "CONCORRENTE_IRREGULAR",
    label: "Concorrente com prática irregular",
  },
  {
    value: "INTEGRADORA_LIMITA",
    label: "Contrato com integradora limita escolha da registradora",
  },
  {
    value: "SEM_CREDENCIAMENTO_UF",
    label: "Sem credenciamento em UF de operação",
  },
  { value: "RECUSA_TROCAR_SISTEMA", label: "Recusa em mudar o sistema atual" },
  { value: "SEM_INTERESSE", label: "Sem interesse / sem fit comercial" },
  { value: "OUTRO", label: "Outro" },
];

const KNOWN_ACOES = new Set<AcaoAtividade>([
  "NENHUMA",
  "DESFECHO_PRIMEIRO_CONTATO",
  "QUALIFICACAO_FORM",
  "DESFECHO_RETORNO_EMAIL",
  "DESFECHO_DEMO",
  "ANEXAR_PROPOSTA",
  "DESFECHO_PROPOSTA",
  "DESFECHO_NEGOCIACAO",
  "DESFECHO_FOLLOW_NEGOCIACAO",
  "CONFERIR_UFS_EXPANSAO",
  "DESFECHO_FORMALIZACAO",
  "REGISTRAR_CHAMADO_JURIDICO",
  "DESFECHO_CHAMADO_JURIDICO",
  "DESFECHO_SOLICITACAO_CADASTRO",
  "DESFECHO_RECUPERACAO_LEAD",
  "DESFECHO_SONDAGEM_EXPANSAO",
  "OBSERVAR_FLUXO_EREGISTRO",
  "DESFECHO_ABORDAGEM_VOLUME",
  "DESFECHO_REUNIAO_VOLUME",
  "DESFECHO_STANDBY_EXPANSAO",
  "CONFIRMAR_BOAS_VINDAS_OPERACOES",
  "DESFECHO_ACOMPANHAMENTO_REGISTROS",
  "DESFECHO_CONFIRMACAO_INICIO_REGISTROS",
  "CONFIRMAR_RETORNO",
  "REGISTRAR_CONTATO",
  "REGISTRAR_NOTA",
]);

function coerceAcao(value: unknown): AcaoAtividade | null {
  if (typeof value !== "string") return null;
  return KNOWN_ACOES.has(value as AcaoAtividade)
    ? (value as AcaoAtividade)
    : null;
}

// Heurística por título (baixa prioridade, mas cobre follow-up de negociação).
function heuristicaPorTitulo(titulo: string): AcaoAtividade | null {
  const t = titulo.toLowerCase();
  if (t.includes("follow") && t.includes("negocia"))
    return "DESFECHO_FOLLOW_NEGOCIACAO";
  if (t.includes("recuperar") && t.includes("lead"))
    return "DESFECHO_RECUPERACAO_LEAD";
  return null;
}

export function resolveAcaoAtividade(
  atividade: AtividadeListItem,
): AcaoAtividade {
  // 1) heurística de título (regra especial: follow-up de negociação herda
  //    template de "Negociar condições", então título tem prioridade sobre metadata quando bate)
  const porTitulo = heuristicaPorTitulo(atividade.titulo ?? "");
  if (porTitulo) return porTitulo;

  // 2) metadata.acao
  const meta = coerceAcao(atividade.metadata?.acao);
  if (meta) return meta;

  // 3) templateItem.acao
  const tmpl = coerceAcao(atividade.templateItem?.acao);
  if (tmpl) return tmpl;

  return "NENHUMA";
}

// Labels de estágio de Aquisição (usado no header/lateral).
export const ESTAGIO_LABEL: Record<string, string> = {
  PROSPECCAO: "Prospecção",
  QUALIFICACAO: "Qualificação",
  APRESENTACAO: "Apresentação comercial",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  FECHAMENTO: "Fechamento",
  AGUARDANDO_REGISTROS: "Aguardando registros",
  MAPEAMENTO: "Mapeamento",
  STANDBY: "Standby",
  SEM_CONTATO: "Sem contato",
  EM_CONTATO: "Em contato",
  NEGOCIANDO: "Negociando",
  FECHADO: "Fechado",
  CADASTRO: "Cadastro",
  CADASTRO_REALIZADO: "Cadastro realizado",
};

export function estagioLabel(estagio: string): string {
  return ESTAGIO_LABEL[estagio] ?? estagio;
}
