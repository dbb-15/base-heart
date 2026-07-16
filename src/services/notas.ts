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
      return MOCK_NOTAS[oportunidadeId] ?? [];
    }
  },
  create: async (
    oportunidadeId: UUID,
    input: { texto: string; contatoId?: UUID; contatoNome?: string; tipo?: Nota["tipo"] },
  ): Promise<Nota> => {
    try {
      return await api.post<Nota>(`/oportunidades/${oportunidadeId}/notas`, input);
    } catch {
      const n: Nota = {
        id: `mock-nota-${Date.now()}`,
        texto: input.texto,
        criadaEm: new Date().toISOString(),
        autorNome: "Você (mock)",
        contatoId: input.contatoId ?? null,
        contatoNome: input.contatoNome ?? null,
        tipo: input.tipo ?? "COMUM",
      };
      MOCK_NOTAS[oportunidadeId] = [n, ...(MOCK_NOTAS[oportunidadeId] ?? [])];
      return n;
    }
  },
  update: async (
    id: UUID,
    input: { texto: string; contatoId?: UUID | null; contatoNome?: string | null },
  ): Promise<Nota> => {
    try {
      return await api.put<Nota>(`/notas/${id}`, input);
    } catch {
      for (const arr of Object.values(MOCK_NOTAS)) {
        const n = arr.find((x) => x.id === id);
        if (n) {
          n.texto = input.texto;
          n.contatoId = input.contatoId ?? null;
          n.contatoNome = input.contatoNome ?? null;
          return n;
        }
      }
      return { id, texto: input.texto, criadaEm: new Date().toISOString() };
    }
  },
  remove: (id: UUID) => api.delete<void>(`/notas/${id}`),
};
