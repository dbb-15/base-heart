// Domain constants: etapas do funil, tipos de atividade, etc.
// Mantém em português alinhado ao backend.

export const ETAPAS_FUNIL = [
  "prospeccao",
  "qualificacao",
  "proposta",
  "negociacao",
  "fechamento",
] as const;

export type EtapaFunil = (typeof ETAPAS_FUNIL)[number];

export const TIPOS_ATIVIDADE = [
  "ligacao",
  "email",
  "reuniao",
  "tarefa",
  "nota",
] as const;

export type TipoAtividade = (typeof TIPOS_ATIVIDADE)[number];

export const DESFECHOS = [
  "ganho",
  "perdido",
  "sem_contato",
  "adiado",
] as const;

export type Desfecho = (typeof DESFECHOS)[number];
