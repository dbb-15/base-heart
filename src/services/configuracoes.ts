// Configurações — cadência de follow-ups.
import { api } from "./api";
import type { Cadencia } from "../types";

const MOCK_CADENCIA: Cadencia = {
  primeiroContatoDias: 3,
  retornoEmailDias: 5,
  retornoPropostaDias: 7,
  negociacaoDias: 3,
  recuperacaoLeadDias: 30,
  standbyExpansaoDias: 30,
};

export const configuracoesService = {
  getCadencia: async (): Promise<Cadencia> => {
    try {
      const data = await api.get<Cadencia>("/configuracoes/cadencia");
      return data ?? MOCK_CADENCIA;
    } catch {
      return { ...MOCK_CADENCIA };
    }
  },
  updateCadencia: async (input: Cadencia): Promise<Cadencia> => {
    try {
      return await api.put<Cadencia>("/configuracoes/cadencia", input);
    } catch {
      Object.assign(MOCK_CADENCIA, input);
      return { ...MOCK_CADENCIA };
    }
  },
};
