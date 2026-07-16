// Stub tipado — endpoints reais a definir com o backend.
import { api } from "./api";
import type { Conta, Paginated, UUID } from "../types";

export const contasService = {
  list: () => api.get<Paginated<Conta>>("/contas"),
  get: (id: UUID) => api.get<Conta>(`/contas/${id}`),
};
