// Service tipado para /oportunidades.
// Espelha contrato backend (Fastify). Filtros/campos podem crescer sem quebrar UI.
// Fallback: quando a API falha (backend offline), retorna fixtures de src/services/mocks.
import { api } from "./api";
import type { OportunidadeListItem, Pipeline, Produto, UUID } from "../types";
import {
  MOCK_OPORTUNIDADES,
  MOCK_TIMELINE,
  MOCK_WORKFLOWS,
  isMockId,
} from "./mocks";

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

function filterMocks(f?: ListOportunidadesFilters): OportunidadeListItem[] {
  return MOCK_OPORTUNIDADES.filter((o) => {
    if (f?.pipeline && o.pipeline !== f.pipeline) return false;
    if (f?.status && o.status !== f.status) return false;
    if (f?.produto && o.produto !== f.produto) return false;
    if (f?.ownerId && o.ownerId !== f.ownerId) return false;
    if (f?.search) {
      const s = f.search.toLowerCase();
      const hay =
        `${o.conta?.nomeFantasia ?? ""} ${o.conta?.razaoSocial ?? ""} ${o.produto ?? ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
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
  list: async (filters?: ListOportunidadesFilters) => {
    try {
      const data = await api.get<OportunidadeListItem[]>(
        `/oportunidades${toQuery(filters as Record<string, unknown> | undefined)}`,
      );
      const arr = Array.isArray(data) ? data : [];
      // Sempre incluir mocks para permitir visualizar sem backend populado.
      return [...arr, ...filterMocks(filters)];
    } catch {
      return filterMocks(filters);
    }
  },
  get: async (id: UUID) => {
    if (isMockId(id)) {
      const m = MOCK_OPORTUNIDADES.find((o) => o.id === id);
      if (m) return m;
    }
    try {
      return await api.get<OportunidadeListItem>(`/oportunidades/${id}`);
    } catch (err) {
      const m = MOCK_OPORTUNIDADES.find((o) => o.id === id);
      if (m) return m;
      throw err;
    }
  },
  workflow: async (id: UUID) => {
    if (isMockId(id) && MOCK_WORKFLOWS[id]) return MOCK_WORKFLOWS[id];
    return api.get<import("../types").WorkflowAtual>(
      `/oportunidades/${id}/workflow`,
    );
  },
  timeline: async (id: UUID) => {
    if (isMockId(id)) return MOCK_TIMELINE[id] ?? [];
    return api.get<import("../types").TimelineItem[]>(
      `/oportunidades/${id}/timeline`,
    );
  },
  aplicarDesfecho: (id: UUID, input: AplicarDesfechoInput) =>
    api.post<OportunidadeListItem>(`/oportunidades/${id}/desfecho`, input),
};
