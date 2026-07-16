// Notas de oportunidade.
// Fallback: fixtures mock para oportunidades "mock-*".
import { api } from "./api";
import type { Nota, UUID } from "../types";
import { MOCK_NOTAS, isMockId } from "./mocks";

export const notasService = {
  list: async (oportunidadeId: UUID) => {
    if (isMockId(oportunidadeId)) return MOCK_NOTAS[oportunidadeId] ?? [];
    try {
      return await api.get<Nota[]>(`/oportunidades/${oportunidadeId}/notas`);
    } catch {
      return [];
    }
  },
  create: (
    oportunidadeId: UUID,
    input: { texto: string; contatoId?: UUID },
  ) => api.post<Nota>(`/oportunidades/${oportunidadeId}/notas`, input),
  update: (id: UUID, input: { texto: string; contatoId?: UUID | null }) =>
    api.put<Nota>(`/notas/${id}`, input),
  remove: (id: UUID) => api.delete<void>(`/notas/${id}`),
};
