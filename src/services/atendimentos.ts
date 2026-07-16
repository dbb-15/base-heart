// Service /atendimentos — operações.
// Fallback in-memory quando o backend não responde.
import { api } from "./api";
import type { ISODate, UUID } from "../types";

export type AtendimentoClassificacao = "INFORMACAO" | "SOLICITACAO" | "RECLAMACAO";
export type AtendimentoCanal = "EMAIL" | "TELEFONE" | "WHATSAPP" | "PORTAL" | "OUTRO";

export interface Atendimento {
  id: UUID;
  contaNome?: string | null;
  contaId?: UUID | null;
  classificacao: AtendimentoClassificacao;
  canal: AtendimentoCanal;
  tipoDemanda?: string | null;
  ufDetran?: string | null;
  chassi?: string | null;
  descricao: string;
  criadoEm: ISODate;
  ownerNome?: string | null;
}

export interface AtendimentoInput {
  contaNome?: string;
  contaId?: UUID;
  classificacao: AtendimentoClassificacao;
  canal: AtendimentoCanal;
  tipoDemanda?: string;
  ufDetran?: string;
  chassi?: string;
  descricao: string;
}

const MOCK: Atendimento[] = [
  {
    id: "mock-at-1",
    contaNome: "Banco Modelo S.A.",
    classificacao: "SOLICITACAO",
    canal: "EMAIL",
    tipoDemanda: "Segunda via",
    ufDetran: "SP",
    descricao: "Cliente solicitou segunda via de contrato.",
    criadoEm: new Date(Date.now() - 86400_000).toISOString(),
    ownerNome: "Ops (mock)",
  },
  {
    id: "mock-at-2",
    contaNome: "CoopSolar",
    classificacao: "RECLAMACAO",
    canal: "TELEFONE",
    tipoDemanda: "Divergência de dados",
    descricao: "Reclamação de divergência em registro.",
    criadoEm: new Date(Date.now() - 3 * 86400_000).toISOString(),
    ownerNome: "Ops (mock)",
  },
];

export const atendimentosService = {
  list: async (): Promise<Atendimento[]> => {
    try {
      const data = await api.get<Atendimento[]>("/atendimentos");
      return Array.isArray(data) ? [...data, ...MOCK] : MOCK;
    } catch {
      return MOCK;
    }
  },
  create: async (input: AtendimentoInput): Promise<Atendimento> => {
    try {
      return await api.post<Atendimento>("/atendimentos", input);
    } catch {
      const novo: Atendimento = {
        id: `mock-at-${Date.now()}`,
        criadoEm: new Date().toISOString(),
        ownerNome: "Você (mock)",
        ...input,
      };
      MOCK.unshift(novo);
      return novo;
    }
  },
};
