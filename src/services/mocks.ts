// Fixtures mockadas para visualizar telas sem backend.
// Não substituem a API — servem só como fallback quando o Fastify não está de pé
// e para navegar pelo lead "mock-001" na tela de oportunidade.
import type {
  AtividadeListItem,
  Nota,
  OportunidadeListItem,
  TimelineItem,
  WorkflowAtual,
} from "../types";

export const MOCK_OPP_ID = "mock-001";

export const MOCK_OPORTUNIDADES: OportunidadeListItem[] = [
  {
    id: MOCK_OPP_ID,
    pipeline: "AQUISICAO",
    produto: "E_REGISTRO",
    estagio: "QUALIFICACAO",
    status: "ABERTA",
    valorEstimadoMensal: 12500,
    previsaoFechamento: new Date(Date.now() + 15 * 86400_000).toISOString(),
    conta: {
      id: "mock-conta-1",
      nomeFantasia: "Banco Modelo S.A.",
      razaoSocial: "Banco Modelo Sociedade Anônima",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-1",
    criadaEm: new Date(Date.now() - 3 * 86400_000).toISOString(),
  },
  {
    id: "mock-002",
    pipeline: "AQUISICAO",
    produto: "E_BUSCAR",
    estagio: "PROSPECCAO",
    status: "ABERTA",
    valorEstimadoMensal: 4800,
    conta: {
      id: "mock-conta-2",
      nomeFantasia: "Financeira Alfa",
      razaoSocial: "Alfa Crédito e Financiamento",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-2",
    criadaEm: new Date(Date.now() - 10 * 86400_000).toISOString(),
  },
];

export const MOCK_ATIVIDADES: Record<string, AtividadeListItem[]> = {
  [MOCK_OPP_ID]: [
    {
      id: "mock-atv-1",
      titulo: "Pesquisar empresa",
      tipo: "TAREFA",
      status: "CONCLUIDA",
      dataHora: new Date(Date.now() - 2 * 86400_000).toISOString(),
      obrigatoria: true,
      templateItem: { acao: "NENHUMA", ordem: 1 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-2",
      titulo: "Realizar primeiro contato",
      tipo: "LIGACAO",
      status: "PENDENTE",
      dataHora: new Date().toISOString(),
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_PRIMEIRO_CONTATO", ordem: 2 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-3",
      titulo: "Registrar qualificação",
      tipo: "TAREFA",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "QUALIFICACAO_FORM", ordem: 3 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-4",
      titulo: "Enviar apresentação comercial",
      tipo: "EMAIL",
      status: "PENDENTE",
      obrigatoria: false,
      templateItem: { acao: "NENHUMA", ordem: 4 },
      oportunidadeId: MOCK_OPP_ID,
    },
  ],
};

export const MOCK_WORKFLOWS: Record<string, WorkflowAtual> = {
  [MOCK_OPP_ID]: {
    estagio: "QUALIFICACAO",
    totalObrigatorias: 3,
    concluidasObrigatorias: 1,
    pendentes: [
      {
        atividadeId: "mock-atv-2",
        titulo: "Realizar primeiro contato",
        obrigatoria: true,
        concluida: false,
      },
      {
        atividadeId: "mock-atv-3",
        titulo: "Registrar qualificação",
        obrigatoria: true,
        concluida: false,
      },
    ],
  },
};

export const MOCK_NOTAS: Record<string, Nota[]> = {
  [MOCK_OPP_ID]: [
    {
      id: "mock-nota-1",
      texto: "Cliente demonstrou interesse em ampliar cobertura de UFs.",
      criadaEm: new Date(Date.now() - 86400_000).toISOString(),
      autorNome: "Você (mock)",
    },
  ],
};

export const MOCK_TIMELINE: Record<string, TimelineItem[]> = {
  [MOCK_OPP_ID]: [
    {
      id: "mock-tl-1",
      tipo: "EVENTO",
      titulo: "Oportunidade criada",
      descricao: "Pipeline: Aquisição",
      data: new Date(Date.now() - 3 * 86400_000).toISOString(),
    },
    {
      id: "mock-tl-2",
      tipo: "ATIVIDADE",
      titulo: "Pesquisar empresa concluída",
      data: new Date(Date.now() - 2 * 86400_000).toISOString(),
    },
  ],
};

export function isMockId(id: string | undefined | null): boolean {
  return !!id && id.startsWith("mock-");
}
