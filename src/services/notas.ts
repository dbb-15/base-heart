// Notas de oportunidade.
import { api } from "./api";
import type { Nota, UUID } from "../types";

export const notasService = {
  list: (oportunidadeId: UUID) =>
    api.get<Nota[]>(`/oportunidades/${oportunidadeId}/notas`),
  create: (
    oportunidadeId: UUID,
    input: { texto: string; contatoId?: UUID },
  ) => api.post<Nota>(`/oportunidades/${oportunidadeId}/notas`, input),
  update: (id: UUID, input: { texto: string; contatoId?: UUID | null }) =>
    api.put<Nota>(`/notas/${id}`, input),
  remove: (id: UUID) => api.delete<void>(`/notas/${id}`),
};
