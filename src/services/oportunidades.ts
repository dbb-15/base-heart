// Stub tipado — endpoints reais a definir com o backend.
import { api } from "./api";
import type { Oportunidade, Paginated, UUID } from "../types";

export const oportunidadesService = {
  list: (params?: { page?: number; pageSize?: number }) =>
    api.get<Paginated<Oportunidade>>(
      `/oportunidades${toQuery(params)}`,
    ),
  get: (id: UUID) => api.get<Oportunidade>(`/oportunidades/${id}`),
};

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (!entries.length) return "";
  const q = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
  return `?${q}`;
}
