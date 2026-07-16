// Serviço de autenticação. Endpoints reais devem ser confirmados com o backend
// Fastify — os paths abaixo seguem convenções comuns e podem ser ajustados.
import { api } from "./api";
import type { LoginPayload, Session, User } from "../types";

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<Session>("/auth/login", payload, { auth: false }),

  logout: () => api.post<void>("/auth/logout"),

  me: () => api.get<User>("/auth/me"),
};
