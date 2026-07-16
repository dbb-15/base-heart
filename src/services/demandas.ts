// Service /demandas — operações. Matriz dificuldade × impacto.
import { api } from "./api";
import type { ISODate, UUID } from "../types";

export type Nivel = "BAIXO" | "MEDIO" | "ALTO";

export interface Demanda {
  id: UUID;
  contaNome?: string | null;
  contaId?: UUID | null;
  titulo: string;
  descricao?: string | null;
  dificuldade: Nivel;
  impacto: Nivel;
  criadoEm: ISODate;
  ownerNome?: string | null;
}

export interface DemandaInput {
  contaNome?: string;
  contaId?: UUID;
  titulo: string;
  descricao?: string;
  dificuldade: Nivel;
  impacto: Nivel;
}

const MOCK: Demanda[] = [
  {
    id: "mock-dm-1",
    contaNome: "Banco Modelo S.A.",
    titulo: "Integração via API",
    descricao: "Cliente pediu integração customizada.",
    dificuldade: "ALTO",
    impacto: "ALTO",
    criadoEm: new Date(Date.now() - 2 * 86400_000).toISOString(),
    ownerNome: "Ops (mock)",
  },
  {
    id: "mock-dm-2",
    contaNome: "Financeira Alfa",
    titulo: "Relatório mensal customizado",
    dificuldade: "MEDIO",
    impacto: "BAIXO",
    criadoEm: new Date(Date.now() - 5 * 86400_000).toISOString(),
    ownerNome: "Ops (mock)",
  },
];

export const demandasService = {
  list: async (): Promise<Demanda[]> => {
    try {
      const data = await api.get<Demanda[]>("/demandas");
      return Array.isArray(data) ? [...data, ...MOCK] : MOCK;
    } catch {
      return MOCK;
    }
  },
  create: async (input: DemandaInput): Promise<Demanda> => {
    try {
      return await api.post<Demanda>("/demandas", input);
    } catch {
      const novo: Demanda = {
        id: `mock-dm-${Date.now()}`,
        criadoEm: new Date().toISOString(),
        ownerNome: "Você (mock)",
        ...input,
      };
      MOCK.unshift(novo);
      return novo;
    }
  },
};

export const NIVEIS: Nivel[] = ["BAIXO", "MEDIO", "ALTO"];
export const NIVEL_LABEL: Record<Nivel, string> = {
  BAIXO: "Baixo",
  MEDIO: "Médio",
  ALTO: "Alto",
};
