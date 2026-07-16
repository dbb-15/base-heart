// Stub tipado — endpoints reais a definir com o backend.
import { api } from "./api";
import type { Paginated, Registradora, UUID } from "../types";

export const registradorasService = {
  list: () => api.get<Paginated<Registradora>>("/registradoras"),
  get: (id: UUID) => api.get<Registradora>(`/registradoras/${id}`),
};
