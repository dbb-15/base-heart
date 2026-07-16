// Registradoras — catálogo para picker + admin.
// Backend: GET /registradoras?search=&ids=  (array).
import { api } from "./api";
import type { Registradora, UUID } from "../types";

const MOCK_REGISTRADORAS: Registradora[] = [
  { id: "reg-1", nome: "CRA-RJ", cnpj: "12.345.678/0001-90" },
  { id: "reg-2", nome: "CRA-SP", cnpj: "23.456.789/0001-12" },
  { id: "reg-3", nome: "CENPROT Nacional", cnpj: "34.567.890/0001-34" },
  { id: "reg-4", nome: "IEPTB-BR", cnpj: "45.678.901/0001-56" },
  { id: "reg-5", nome: "CRA-MG", cnpj: "56.789.012/0001-78" },
];

function filterMocks(search?: string): Registradora[] {
  if (!search) return MOCK_REGISTRADORAS;
  const s = search.toLowerCase();
  return MOCK_REGISTRADORAS.filter(
    (r) =>
      r.nome.toLowerCase().includes(s) ||
      (r.cnpj ?? "").toLowerCase().includes(s),
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
  get: (id: UUID) => api.get<Registradora>(`/registradoras/${id}`),
};
