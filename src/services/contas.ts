// Contas / Financeiras — busca simples com fallback mock.
import { api } from "./api";
import type { Conta, StatusConta, UUID } from "../types";

const MOCK_CONTAS: Conta[] = [
  {
    id: "mock-conta-cli-1",
    razaoSocial: "Banco Vega S.A.",
    nomeFantasia: "Vega",
    cnpj: "11.222.333/0001-44",
    status: "CLIENTE",
  },
  {
    id: "mock-conta-cli-2",
    razaoSocial: "Cooperativa Solar",
    nomeFantasia: "CoopSolar",
    cnpj: "22.333.444/0001-55",
    status: "CLIENTE",
  },
  {
    id: "mock-conta-cli-3",
    razaoSocial: "Consórcio Nova Era",
    nomeFantasia: "Nova Era",
    cnpj: "33.444.555/0001-66",
    status: "CLIENTE",
  },
  {
    id: "mock-conta-1",
    razaoSocial: "Banco Modelo Sociedade Anônima",
    nomeFantasia: "Banco Modelo S.A.",
    cnpj: "44.555.666/0001-77",
    status: "PROSPECT",
  },
];

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

function filterMocks(params?: { search?: string; status?: StatusConta }): Conta[] {
  return MOCK_CONTAS.filter((c) => {
    if (params?.status && c.status !== params.status) return false;
    if (params?.search) {
      const s = params.search.toLowerCase();
      const hay = `${c.nomeFantasia ?? ""} ${c.razaoSocial ?? ""} ${c.cnpj ?? ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
}

export const contasService = {
  list: async (params?: { search?: string; status?: StatusConta }) => {
    try {
      const data = await api.get<Conta[]>(`/contas${toQuery(params as Record<string, unknown> | undefined)}`);
      const arr = Array.isArray(data) ? data : [];
      return arr.length ? arr : filterMocks(params);
    } catch {
      return filterMocks(params);
    }
  },
  get: (id: UUID) => api.get<Conta>(`/contas/${id}`),
};
