// Service de notificações. Backend: GET /notificacoes, PATCH /notificacoes/:id/lida.
// Fallback: fixtures locais.
import { api, ApiError } from "./api";

export interface Notificacao {
  id: string;
  titulo: string;
  descricao?: string;
  criadaEm: string;
  lida: boolean;
  link?: string;
}

const MOCK: Notificacao[] = [
  {
    id: "n1",
    titulo: "Follow-up de negociação vence hoje",
    descricao: "Banco Modelo S.A. — Negociação",
    criadaEm: new Date().toISOString(),
    lida: false,
    link: "#/oportunidades/mock-001",
  },
  {
    id: "n2",
    titulo: "Nova solicitação de cadastro em Operações",
    descricao: "Financeira Alfa",
    criadaEm: new Date(Date.now() - 3600_000).toISOString(),
    lida: false,
    link: "#/operacoes",
  },
];

export async function listNotificacoes(): Promise<Notificacao[]> {
  try {
    return await api.get<Notificacao[]>("/notificacoes");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    return MOCK;
  }
}

export async function marcarLida(id: string): Promise<void> {
  try {
    await api.patch<void>(`/notificacoes/${id}/lida`, {});
  } catch {
    /* silencioso em fallback */
  }
}
