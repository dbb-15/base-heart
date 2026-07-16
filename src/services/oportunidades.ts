// Service tipado para /oportunidades.
// Espelha contrato backend (Fastify). Filtros/campos podem crescer sem quebrar UI.
// Fallback: quando a API falha (backend offline), retorna fixtures de src/services/mocks.
import { api } from "./api";
import type { OportunidadeListItem, Pipeline, Produto, UUID } from "../types";
import {
  MOCK_OPORTUNIDADES,
  MOCK_TIMELINE,
  MOCK_WORKFLOWS,
  isMockId,
} from "./mocks";

export interface ListOportunidadesFilters {
  pipeline?: Pipeline;
  status?: "ABERTA" | "CLOSED_WON" | "CLOSED_LOST";
  ownerId?: UUID;
  produto?: Produto;
  estagio?: string;
  search?: string;
  contaId?: UUID;
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

function filterMocks(f?: ListOportunidadesFilters): OportunidadeListItem[] {
  return MOCK_OPORTUNIDADES.filter((o) => {
    if (f?.pipeline && o.pipeline !== f.pipeline) return false;
    if (f?.status && o.status !== f.status) return false;
    if (f?.produto && o.produto !== f.produto) return false;
    if (f?.ownerId && o.ownerId !== f.ownerId) return false;
    if (f?.search) {
      const s = f.search.toLowerCase();
      const hay =
        `${o.conta?.nomeFantasia ?? ""} ${o.conta?.razaoSocial ?? ""} ${o.produto ?? ""}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  });
}

export interface AplicarDesfechoInput {
  atividadeId: string;
  resultado: "AVANCAR" | "PERMANECER" | "LOST";
  concluirAtividade?: boolean;
  criarFollowUp?: boolean;
  criarFollowNegociacao?: boolean;
  dataRetorno?: string;
  metadata?: Record<string, unknown>;
  dadosQualificacao?: Record<string, unknown>;
  motivoPerda?: string;
}

export const oportunidadesService = {
  list: async (filters?: ListOportunidadesFilters) => {
    try {
      const data = await api.get<OportunidadeListItem[]>(
        `/oportunidades${toQuery(filters as Record<string, unknown> | undefined)}`,
      );
      const arr = Array.isArray(data) ? data : [];
      // Sempre incluir mocks para permitir visualizar sem backend populado.
      return [...arr, ...filterMocks(filters)];
    } catch {
      return filterMocks(filters);
    }
  },
  get: async (id: UUID) => {
    if (isMockId(id)) {
      const m = MOCK_OPORTUNIDADES.find((o) => o.id === id);
      if (m) return m;
    }
    try {
      return await api.get<OportunidadeListItem>(`/oportunidades/${id}`);
    } catch (err) {
      const m = MOCK_OPORTUNIDADES.find((o) => o.id === id);
      if (m) return m;
      throw err;
    }
  },
  workflow: async (id: UUID) => {
    if (isMockId(id) && MOCK_WORKFLOWS[id]) return MOCK_WORKFLOWS[id];
    return api.get<import("../types").WorkflowAtual>(
      `/oportunidades/${id}/workflow`,
    );
  },
  timeline: async (id: UUID) => {
    if (isMockId(id)) return MOCK_TIMELINE[id] ?? [];
    return api.get<import("../types").TimelineItem[]>(
      `/oportunidades/${id}/timeline`,
    );
  },
  aplicarDesfecho: async (id: UUID, input: AplicarDesfechoInput) => {
    if (isMockId(id)) {
      // simula efeito no mock in-memory para feedback visual
      const opp = MOCK_OPORTUNIDADES.find((o) => o.id === id);
      const acts = (await import("./mocks")).MOCK_ATIVIDADES[id] ?? [];
      const atv = acts.find((a) => a.id === input.atividadeId);
      if (atv && input.concluirAtividade !== false && input.resultado !== "PERMANECER") {
        atv.status = "CONCLUIDA";
      } else if (atv && input.resultado === "PERMANECER" && input.concluirAtividade) {
        atv.status = "CONCLUIDA";
      }
      const meta = (input.metadata ?? {}) as Record<string, unknown>;
      if (opp) {
        if (input.resultado === "LOST") opp.status = "CLOSED_LOST";
        else if (input.resultado === "AVANCAR") {
          if (meta.iniciouRegistros) opp.status = "CLOSED_WON";
        }
        // Sondagem expansão define ramo + move de estágio
        if (typeof meta.tipoExpansao === "string") {
          const t = meta.tipoExpansao as "UF" | "VOLUME" | "STANDBY";
          opp.tipoExpansao = t;
          if (t === "UF") opp.estagio = "PROPOSTA";
          else if (t === "VOLUME") opp.estagio = "SEM_CONTATO";
          else opp.estagio = "STANDBY";
        }
      }
      return opp ?? ({ id } as OportunidadeListItem);
    }
    return api.post<OportunidadeListItem>(`/oportunidades/${id}/desfecho`, input);
  },
  create: async (input: {
    pipeline: Pipeline;
    contaId: UUID;
    produto?: Produto;
    tipoExpansao?: import("../types").TipoExpansao;
    motivo?: string;
    valorEstimadoMensal?: number;
  }) => {
    // Fallback mock: cria opp local (backend real usa POST /oportunidades)
    try {
      return await api.post<OportunidadeListItem>("/oportunidades", input);
    } catch {
      const id = `mock-new-${Date.now()}`;
      const conta = MOCK_OPORTUNIDADES.find((o) => o.contaId === input.contaId)?.conta;
      const estagio =
        input.pipeline === "EXPANSAO"
          ? input.tipoExpansao === "STANDBY"
            ? "STANDBY"
            : "MAPEAMENTO"
          : "PROSPECCAO";
      const opp: OportunidadeListItem = {
        id,
        pipeline: input.pipeline,
        produto: input.produto ?? null,
        estagio,
        status: "ABERTA",
        tipoExpansao: input.tipoExpansao ?? null,
        valorEstimadoMensal: input.valorEstimadoMensal ?? null,
        conta: conta ?? { id: input.contaId, nomeFantasia: "Nova conta" },
        contaId: input.contaId,
        owner: { id: "dev-user", nome: "Você (mock)" },
        ownerId: "dev-user",
        criadaEm: new Date().toISOString(),
      };
      MOCK_OPORTUNIDADES.unshift(opp);
      return opp;
    }
  },
};


