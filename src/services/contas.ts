// Contas / Financeiras — busca simples com fallback mock.
import { api } from "./api";
import type { Conta, Segmento, StatusConta, UUID } from "../types";

const MOCK_CONTAS: Conta[] = [
  {
    id: "mock-conta-cli-1",
    razaoSocial: "Banco Vega S.A.",
    nomeFantasia: "Vega",
    cnpj: "11.222.333/0001-44",
    status: "CLIENTE",
    segmento: "BANCO",
    grupoId: "mock-grp-1",
    grupoNome: "Grupo Vega",
    ownerNome: "Você (mock)",
    uf: "SP",
    municipio: "São Paulo",
    criadaEm: new Date(Date.now() - 90 * 86400_000).toISOString(),
  },
  {
    id: "mock-conta-cli-2",
    razaoSocial: "Cooperativa Solar",
    nomeFantasia: "CoopSolar",
    cnpj: "22.333.444/0001-55",
    status: "CLIENTE",
    segmento: "COOPERATIVA",
    grupoId: "mock-grp-2",
    grupoNome: "Cooperativas Sul",
    ownerNome: "Você (mock)",
    uf: "RS",
    municipio: "Porto Alegre",
  },
  {
    id: "mock-conta-cli-3",
    razaoSocial: "Consórcio Nova Era",
    nomeFantasia: "Nova Era",
    cnpj: "33.444.555/0001-66",
    status: "CLIENTE",
    segmento: "CONSORCIO",
    ownerNome: "Você (mock)",
    uf: "MG",
    municipio: "Belo Horizonte",
  },
  {
    id: "mock-conta-1",
    razaoSocial: "Banco Modelo Sociedade Anônima",
    nomeFantasia: "Banco Modelo S.A.",
    cnpj: "44.555.666/0001-77",
    status: "PROSPECT",
    segmento: "BANCO",
    grupoId: "mock-grp-1",
    grupoNome: "Grupo Vega",
    ownerNome: "Você (mock)",
    uf: "SP",
    municipio: "Campinas",
  },
  {
    id: "mock-conta-2",
    razaoSocial: "Alfa Crédito e Financiamento",
    nomeFantasia: "Financeira Alfa",
    cnpj: "55.666.777/0001-88",
    status: "PROSPECT",
    segmento: "FINANCEIRA",
    ownerNome: "Você (mock)",
    uf: "PR",
    municipio: "Curitiba",
  },
];

export interface ListContasParams {
  search?: string;
  status?: StatusConta;
  segmento?: Segmento;
  grupoId?: UUID;
}

export interface ContaInput {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  status?: StatusConta;
  segmento?: Segmento;
  grupoId?: UUID | null;
  uf?: string;
  municipio?: string;
}

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

function filterMocks(params?: ListContasParams): Conta[] {
  return MOCK_CONTAS.filter((c) => {
    if (params?.status && c.status !== params.status) return false;
    if (params?.segmento && c.segmento !== params.segmento) return false;
    if (params?.grupoId && c.grupoId !== params.grupoId) return false;
    if (params?.search) {
      const s = params.search.toLowerCase();
      const hay = `${c.nomeFantasia ?? ""} ${c.razaoSocial ?? ""} ${c.cnpj ?? ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
}

export const contasService = {
  list: async (params?: ListContasParams): Promise<Conta[]> => {
    try {
      const data = await api.get<Conta[]>(
        `/contas${toQuery(params as Record<string, unknown> | undefined)}`,
      );
      const arr = Array.isArray(data) ? data : [];
      return arr.length ? arr : filterMocks(params);
    } catch {
      return filterMocks(params);
    }
  },
  get: async (id: UUID): Promise<Conta> => {
    if (id.startsWith("mock-")) {
      const c = MOCK_CONTAS.find((x) => x.id === id);
      if (c) return c;
    }
    try {
      return await api.get<Conta>(`/contas/${id}`);
    } catch (err) {
      const c = MOCK_CONTAS.find((x) => x.id === id);
      if (c) return c;
      throw err;
    }
  },
  create: async (input: ContaInput): Promise<Conta> => {
    try {
      return await api.post<Conta>("/contas", input);
    } catch {
      const c: Conta = {
        id: `mock-conta-${Date.now()}`,
        razaoSocial: input.razaoSocial,
        nomeFantasia: input.nomeFantasia ?? input.razaoSocial,
        cnpj: input.cnpj ?? null,
        status: input.status ?? "PROSPECT",
        segmento: input.segmento ?? null,
        grupoId: input.grupoId ?? null,
        uf: input.uf ?? null,
        municipio: input.municipio ?? null,
        criadaEm: new Date().toISOString(),
        ownerNome: "Você (mock)",
      };
      MOCK_CONTAS.unshift(c);
      return c;
    }
  },
  update: async (id: UUID, input: Partial<ContaInput>): Promise<Conta> => {
    try {
      return await api.put<Conta>(`/contas/${id}`, input);
    } catch {
      const c = MOCK_CONTAS.find((x) => x.id === id);
      if (c) Object.assign(c, input);
      return c ?? ({ id, razaoSocial: input.razaoSocial ?? "" } as Conta);
    }
  },
};
