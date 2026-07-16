// Grupos financeiros — CRUD simples com fallback mock.
import { api } from "./api";
import type { GrupoFinanceiro, UUID } from "../types";

const MOCK_GRUPOS: GrupoFinanceiro[] = [
  { id: "mock-grp-1", nome: "Grupo Vega", descricao: "Holding financeira", totalContas: 2 },
  { id: "mock-grp-2", nome: "Cooperativas Sul", descricao: "Cooperativas parceiras", totalContas: 1 },
];

export interface GrupoInput {
  nome: string;
  descricao?: string;
}

export const gruposService = {
  list: async () => {
    try {
      const data = await api.get<GrupoFinanceiro[]>("/grupos");
      const arr = Array.isArray(data) ? data : [];
      return arr.length ? arr : MOCK_GRUPOS;
    } catch {
      return MOCK_GRUPOS;
    }
  },
  create: async (input: GrupoInput): Promise<GrupoFinanceiro> => {
    try {
      return await api.post<GrupoFinanceiro>("/grupos", input);
    } catch {
      const g: GrupoFinanceiro = {
        id: `mock-grp-${Date.now()}`,
        nome: input.nome,
        descricao: input.descricao ?? null,
        totalContas: 0,
      };
      MOCK_GRUPOS.unshift(g);
      return g;
    }
  },
  update: async (id: UUID, input: GrupoInput): Promise<GrupoFinanceiro> => {
    try {
      return await api.put<GrupoFinanceiro>(`/grupos/${id}`, input);
    } catch {
      const g = MOCK_GRUPOS.find((x) => x.id === id);
      if (g) {
        g.nome = input.nome;
        g.descricao = input.descricao ?? null;
      }
      return g ?? { id, nome: input.nome };
    }
  },
  remove: async (id: UUID) => {
    try {
      await api.delete<void>(`/grupos/${id}`);
    } catch {
      const i = MOCK_GRUPOS.findIndex((x) => x.id === id);
      if (i >= 0) MOCK_GRUPOS.splice(i, 1);
    }
  },
};

export function _mockGrupos() {
  return MOCK_GRUPOS;
}
