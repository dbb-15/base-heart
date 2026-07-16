// Atividades — listar, criar (stub), atualizar status.
import { api } from "./api";
import type { AtividadeListItem, StatusAtividade, UUID } from "../types";

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
  list: (filters?: ListAtividadesFilters) =>
    api.get<AtividadeListItem[]>(
      `/atividades${toQuery(filters as Record<string, unknown> | undefined)}`,
    ),
  updateStatus: (id: UUID, status: StatusAtividade) =>
    api.patch<AtividadeListItem>(`/atividades/${id}/status`, { status }),
};
