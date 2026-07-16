// Stub tipado — endpoints reais a definir com o backend.
import { api } from "./api";
import type { Atividade, Paginated, UUID } from "../types";

export const atividadesService = {
  list: () => api.get<Paginated<Atividade>>("/atividades"),
  get: (id: UUID) => api.get<Atividade>(`/atividades/${id}`),
};
