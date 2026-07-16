// Atividades — listar, criar (stub), atualizar status.
// Fallback: fixtures mock para ids/oportunidades "mock-*".
import { api } from "./api";
import type { AtividadeListItem, StatusAtividade, UUID } from "../types";
import { MOCK_ATIVIDADES, isMockId } from "./mocks";

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

export interface ListAtividadesFilters {
  oportunidadeId?: UUID;
  contaId?: UUID;
  ownerId?: UUID;
  status?: StatusAtividade;
}

export const atividadesService = {
  list: async (filters?: ListAtividadesFilters) => {
    if (filters?.oportunidadeId && isMockId(filters.oportunidadeId)) {
      return MOCK_ATIVIDADES[filters.oportunidadeId] ?? [];
    }
    try {
      return await api.get<AtividadeListItem[]>(
        `/atividades${toQuery(filters as Record<string, unknown> | undefined)}`,
      );
    } catch {
      return [];
    }
  },
  updateStatus: async (id: UUID, status: StatusAtividade) => {
    if (isMockId(id)) {
      // atualiza fixture in-memory para feedback visual
      for (const list of Object.values(MOCK_ATIVIDADES)) {
        const a = list.find((x) => x.id === id);
        if (a) {
          a.status = status;
          return a;
        }
      }
    }
    return api.patch<AtividadeListItem>(`/atividades/${id}/status`, { status });
  },
};
