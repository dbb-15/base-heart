// Registradoras — catálogo compartilhado por picker e Admin.
// Backend: GET/POST/PUT/DELETE em /registradoras (soft delete).
// Fallback: MOCK_REGISTRADORAS mutável — o RegistradorasPicker vê o mesmo array.
import { api, ApiError } from "./api";
import type { Registradora, UUID } from "../types";

const MOCK_REGISTRADORAS: Registradora[] = [
  {
    id: "reg-1",
    nome: "CRA-RJ",
    nomeEmpresarial: "Central Registradora do Rio de Janeiro",
    cnpj: "12.345.678/0001-90",
    tipo: "MATRIZ",
    situacaoCadastral: "ATIVA",
    uf: "RJ",
    municipio: "Rio de Janeiro",
  },
  {
    id: "reg-2",
    nome: "CRA-SP",
    nomeEmpresarial: "Central Registradora de São Paulo",
    cnpj: "23.456.789/0001-12",
    tipo: "MATRIZ",
    situacaoCadastral: "ATIVA",
    uf: "SP",
    municipio: "São Paulo",
  },
  {
    id: "reg-3",
    nome: "CENPROT Nacional",
    cnpj: "34.567.890/0001-34",
    situacaoCadastral: "ATIVA",
  },
  {
    id: "reg-4",
    nome: "IEPTB-BR",
    cnpj: "45.678.901/0001-56",
    situacaoCadastral: "ATIVA",
  },
  {
    id: "reg-5",
    nome: "CRA-MG",
    cnpj: "56.789.012/0001-78",
    situacaoCadastral: "ATIVA",
    uf: "MG",
  },
];

function alive(r: Registradora): boolean {
  return !r.deletedAt;
}

function filterMocks(search?: string): Registradora[] {
  const base = MOCK_REGISTRADORAS.filter(alive);
  if (!search) return base;
  const s = search.toLowerCase();
  return base.filter(
    (r) =>
      r.nome.toLowerCase().includes(s) ||
      (r.cnpj ?? "").toLowerCase().includes(s) ||
      (r.nomeEmpresarial ?? "").toLowerCase().includes(s),
  );
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

export interface RegistradoraInput {
  nome: string; // fantasia (curto exibido na UI)
  nomeEmpresarial?: string;
  cnpj?: string;
  nomeFantasia?: string;
  tipo?: "MATRIZ" | "FILIAL";
  dataAbertura?: string;
  porte?: string;
  situacaoCadastral?: string;
  cnaePrincipalCodigo?: string;
  cnaePrincipalDescricao?: string;
  cnaesSecundarios?: string;
  naturezaJuridicaCodigo?: string;
  naturezaJuridicaDescricao?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  email?: string;
  telefone?: string;
  dataSituacaoCadastral?: string;
  motivoSituacaoCadastral?: string;
  efr?: string;
  situacaoEspecial?: string;
  dataSituacaoEspecial?: string;
}

export const registradorasService = {
  list: async (params?: { search?: string; ids?: string[] }) => {
    try {
      const q = toQuery({
        search: params?.search,
        ids: params?.ids?.join(","),
      });
      const data = await api.get<Registradora[]>(`/registradoras${q}`);
      return Array.isArray(data) && data.length ? data : filterMocks(params?.search);
    } catch {
      return filterMocks(params?.search);
    }
  },
  get: async (id: UUID): Promise<Registradora> => {
    try {
      return await api.get<Registradora>(`/registradoras/${id}`);
    } catch (err) {
      const r = MOCK_REGISTRADORAS.find((x) => x.id === id);
      if (r) return r;
      throw err;
    }
  },
  create: async (input: RegistradoraInput): Promise<Registradora> => {
    try {
      return await api.post<Registradora>("/registradoras", input);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0 && err.status < 500) throw err;
      const r: Registradora = {
        id: `reg-${Date.now()}`,
        ...input,
      };
      MOCK_REGISTRADORAS.unshift(r);
      return r;
    }
  },
  update: async (id: UUID, input: RegistradoraInput): Promise<Registradora> => {
    try {
      return await api.put<Registradora>(`/registradoras/${id}`, input);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0 && err.status < 500) throw err;
      const r = MOCK_REGISTRADORAS.find((x) => x.id === id);
      if (r) Object.assign(r, input);
      return r ?? ({ id, nome: input.nome } as Registradora);
    }
  },
  remove: async (id: UUID) => {
    try {
      await api.delete<void>(`/registradoras/${id}`);
    } catch {
      const r = MOCK_REGISTRADORAS.find((x) => x.id === id);
      if (r) r.deletedAt = new Date().toISOString();
    }
  },
};

// Helper para testes/debug (não usar em produção).
export function _mockRegistradoras() {
  return MOCK_REGISTRADORAS;
}
