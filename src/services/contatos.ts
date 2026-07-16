// Contatos por conta.
import { api } from "./api";
import type { Contato, UUID } from "../types";

const MOCK_CONTATOS: Record<string, Contato[]> = {
  "mock-conta-1": [
    {
      id: "mock-ct-1",
      contaId: "mock-conta-1",
      nome: "Ana Souza",
      cargo: "Diretora Comercial",
      email: "ana@bancomodelo.com.br",
      telefone: "(11) 99999-0001",
      principal: true,
      anotacoes: "Prefere contato por WhatsApp após 14h.",
    },
  ],
  "mock-conta-cli-1": [
    {
      id: "mock-ct-2",
      contaId: "mock-conta-cli-1",
      nome: "Carlos Vega",
      cargo: "COO",
      email: "carlos@vega.com.br",
      telefone: "(21) 98888-0002",
      principal: true,
    },
  ],
};

export interface ContatoInput {
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  principal?: boolean;
  anotacoes?: string;
}

export const contatosService = {
  list: async (contaId: UUID): Promise<Contato[]> => {
    try {
      const data = await api.get<Contato[]>(`/contas/${contaId}/contatos`);
      const arr = Array.isArray(data) ? data : [];
      if (arr.length) return arr;
      return MOCK_CONTATOS[contaId] ?? [];
    } catch {
      return MOCK_CONTATOS[contaId] ?? [];
    }
  },
  create: async (contaId: UUID, input: ContatoInput): Promise<Contato> => {
    try {
      return await api.post<Contato>(`/contas/${contaId}/contatos`, input);
    } catch {
      const c: Contato = {
        id: `mock-ct-${Date.now()}`,
        contaId,
        nome: input.nome,
        cargo: input.cargo ?? null,
        email: input.email ?? null,
        telefone: input.telefone ?? null,
        principal: !!input.principal,
        anotacoes: input.anotacoes ?? null,
      };
      MOCK_CONTATOS[contaId] = [c, ...(MOCK_CONTATOS[contaId] ?? [])];
      return c;
    }
  },
  update: async (id: UUID, input: ContatoInput): Promise<Contato> => {
    try {
      return await api.put<Contato>(`/contatos/${id}`, input);
    } catch {
      for (const arr of Object.values(MOCK_CONTATOS)) {
        const c = arr.find((x) => x.id === id);
        if (c) {
          Object.assign(c, input);
          return c;
        }
      }
      return { id, contaId: "", nome: input.nome };
    }
  },
  remove: async (id: UUID) => {
    try {
      await api.delete<void>(`/contatos/${id}`);
    } catch {
      for (const key of Object.keys(MOCK_CONTATOS)) {
        MOCK_CONTATOS[key] = MOCK_CONTATOS[key].filter((c) => c.id !== id);
      }
    }
  },
};
