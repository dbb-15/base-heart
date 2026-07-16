// Service tipado para /oportunidades.
// Espelha contrato backend (Fastify). Filtros/campos podem crescer sem quebrar UI.
import { api } from "./api";
import type { OportunidadeListItem, Pipeline, Produto, UUID } from "../types";

export interface ListOportunidadesFilters {
  pipeline?: Pipeline;
  status?: "ABERTA" | "CLOSED_WON" | "CLOSED_LOST";
  ownerId?: UUID;
  produto?: Produto;
  estagio?: string;
  search?: string;
  contaId?: UUID;
}

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return "";
  return `?${new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString()}`;
}

export interface AplicarDesfechoInput {
  atividadeId: string;
  resultado: "AVANCAR" | "PERMANECER" | "LOST";
  concluirAtividade?: boolean;
  criarFollowUp?: boolean;
  criarFollowNegociacao?: boolean;
  dataRetorno?: string;
  metadata?: Record<string, unknown>;
  dadosQualificacao?: Record<string, unknown>;
  motivoPerda?: string;
}

export const oportunidadesService = {
  list: (filters?: ListOportunidadesFilters) =>
    api.get<OportunidadeListItem[]>(
      `/oportunidades${toQuery(filters as Record<string, unknown> | undefined)}`,
    ),
  get: (id: UUID) => api.get<OportunidadeListItem>(`/oportunidades/${id}`),
  workflow: (id: UUID) =>
    api.get<import("../types").WorkflowAtual>(
      `/oportunidades/${id}/workflow`,
    ),
  timeline: (id: UUID) =>
    api.get<import("../types").TimelineItem[]>(
      `/oportunidades/${id}/timeline`,
    ),
  aplicarDesfecho: (id: UUID, input: AplicarDesfechoInput) =>
    api.post<OportunidadeListItem>(`/oportunidades/${id}/desfecho`, input),
};
