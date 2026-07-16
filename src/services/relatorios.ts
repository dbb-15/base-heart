// Service de relatórios. Backend: GET /relatorios/* + /export.
// Fallback: agrega mocks para exibir a UI mesmo sem backend.
import { api, ApiError } from "./api";
import { MOCK_OPORTUNIDADES } from "./mocks";

export type RelatorioTipo = "funil" | "conversao" | "ranking" | "motivos-perda";

export interface RelatorioRow {
  chave: string;
  label: string;
  valor: number | string;
  extra?: string;
}

export interface RelatorioResultado {
  tipo: RelatorioTipo;
  titulo: string;
  rows: RelatorioRow[];
}

function mockRelatorio(tipo: RelatorioTipo): RelatorioResultado {
  if (tipo === "funil") {
    const porEstagio = new Map<string, number>();
    for (const o of MOCK_OPORTUNIDADES.filter((x) => x.status === "ABERTA")) {
      porEstagio.set(o.estagio, (porEstagio.get(o.estagio) ?? 0) + 1);
    }
    return {
      tipo,
      titulo: "Funil por estágio",
      rows: [...porEstagio.entries()].map(([k, v]) => ({
        chave: k,
        label: k,
        valor: v,
      })),
    };
  }
  if (tipo === "conversao") {
    const ganhas = MOCK_OPORTUNIDADES.filter((o) => o.status === "CLOSED_WON").length;
    const perdidas = MOCK_OPORTUNIDADES.filter((o) => o.status === "CLOSED_LOST").length;
    const total = ganhas + perdidas;
    return {
      tipo,
      titulo: "Conversão (últimos períodos)",
      rows: [
        { chave: "ganhas", label: "Ganhas", valor: ganhas },
        { chave: "perdidas", label: "Perdidas", valor: perdidas },
        {
          chave: "win",
          label: "Win rate",
          valor: total ? `${Math.round((ganhas / total) * 100)}%` : "—",
        },
      ],
    };
  }
  if (tipo === "ranking") {
    const porOwner = new Map<string, number>();
    for (const o of MOCK_OPORTUNIDADES) {
      const k = o.owner?.nome ?? "—";
      porOwner.set(k, (porOwner.get(k) ?? 0) + 1);
    }
    return {
      tipo,
      titulo: "Ranking por owner",
      rows: [...porOwner.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ chave: k, label: k, valor: v })),
    };
  }
  return {
    tipo,
    titulo: "Motivos de perda",
    rows: [
      { chave: "sem-fit", label: "Sem fit comercial", valor: 3 },
      { chave: "concorrente", label: "Concorrente irregular", valor: 2 },
      { chave: "sem-uf", label: "Sem credenciamento UF", valor: 1 },
    ],
  };
}

export async function getRelatorio(tipo: RelatorioTipo): Promise<RelatorioResultado> {
  try {
    return await api.get<RelatorioResultado>(`/relatorios/${tipo}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    return mockRelatorio(tipo);
  }
}

export function exportarRelatorioCsv(rel: RelatorioResultado): void {
  const header = "chave,label,valor,extra";
  const body = rel.rows
    .map((r) =>
      [r.chave, r.label, r.valor, r.extra ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${rel.tipo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
