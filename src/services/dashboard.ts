// Service de dashboard. Backend: GET /dashboard/comercial.
// Fallback local: agrega mocks para exibir UI sem API.
import { api, ApiError } from "./api";
import { MOCK_OPORTUNIDADES } from "./mocks";
import type { OportunidadeListItem } from "../types";

export interface DashboardKpis {
  oportunidadesAbertas: number;
  ganhas30d: number;
  perdidas30d: number;
  winRate: number; // 0..1
  pipelineValor: number; // soma valorEstimadoMensal abertas
  porEstagio: Array<{ estagio: string; total: number }>;
  proximasAcoes: number;
}

function agregarMock(): DashboardKpis {
  const abertas = MOCK_OPORTUNIDADES.filter((o) => o.status === "ABERTA");
  const ganhas = MOCK_OPORTUNIDADES.filter((o) => o.status === "CLOSED_WON");
  const perdidas = MOCK_OPORTUNIDADES.filter((o) => o.status === "CLOSED_LOST");
  const total = ganhas.length + perdidas.length;
  const porEstagioMap = new Map<string, number>();
  for (const o of abertas) {
    porEstagioMap.set(o.estagio, (porEstagioMap.get(o.estagio) ?? 0) + 1);
  }
  return {
    oportunidadesAbertas: abertas.length,
    ganhas30d: ganhas.length,
    perdidas30d: perdidas.length,
    winRate: total === 0 ? 0 : ganhas.length / total,
    pipelineValor: abertas.reduce(
      (acc: number, o: OportunidadeListItem) => acc + (o.valorEstimadoMensal ?? 0),
      0,
    ),
    porEstagio: [...porEstagioMap.entries()].map(([estagio, total]) => ({
      estagio,
      total,
    })),
    proximasAcoes: abertas.length, // proxy
  };
}

export async function getDashboardComercial(): Promise<DashboardKpis> {
  try {
    return await api.get<DashboardKpis>("/dashboard/comercial");
  } catch (err) {
    if (err instanceof ApiError && err.status !== 401) {
      return agregarMock();
    }
    if (!(err instanceof ApiError)) return agregarMock();
    throw err;
  }
}
