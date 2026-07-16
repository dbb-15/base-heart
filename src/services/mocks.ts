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
  // Expansão — Mapeamento
  {
    id: "mock-exp-1",
    pipeline: "EXPANSAO",
    produto: "E_REGISTRO",
    estagio: "MAPEAMENTO",
    status: "ABERTA",
    tipoExpansao: null,
    valorEstimadoMensal: 7200,
    conta: {
      id: "mock-conta-cli-1",
      nomeFantasia: "Vega",
      razaoSocial: "Banco Vega S.A.",
      status: "CLIENTE",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-cli-1",
  },
  // Expansão UF em Negociação
  {
    id: "mock-exp-2",
    pipeline: "EXPANSAO",
    produto: "E_REGISTRO",
    estagio: "NEGOCIACAO",
    status: "ABERTA",
    tipoExpansao: "UF",
    valorEstimadoMensal: 15400,
    conta: {
      id: "mock-conta-cli-2",
      nomeFantasia: "CoopSolar",
      razaoSocial: "Cooperativa Solar",
      status: "CLIENTE",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-cli-2",
  },
  // Expansão VOLUME em Em contato
  {
    id: "mock-exp-3",
    pipeline: "EXPANSAO",
    produto: "E_BUSCAR",
    estagio: "EM_CONTATO",
    status: "ABERTA",
    tipoExpansao: "VOLUME",
    valorEstimadoMensal: 9800,
    conta: {
      id: "mock-conta-cli-3",
      nomeFantasia: "Nova Era",
      razaoSocial: "Consórcio Nova Era",
      status: "CLIENTE",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-cli-3",
  },
  // Expansão Standby
  {
    id: "mock-exp-4",
    pipeline: "EXPANSAO",
    produto: "E_REGISTRO",
    estagio: "STANDBY",
    status: "ABERTA",
    tipoExpansao: "STANDBY",
    conta: {
      id: "mock-conta-cli-1",
      nomeFantasia: "Vega",
      razaoSocial: "Banco Vega S.A.",
      status: "CLIENTE",
    },
    owner: { id: "dev-user", nome: "Você (mock)" },
    ownerId: "dev-user",
    contaId: "mock-conta-cli-1",
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
    {
      id: "mock-atv-5",
      titulo: "Reunião de sondagem",
      tipo: "REUNIAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_DEMO", ordem: 5 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-6",
      titulo: "Negociar condições",
      tipo: "REUNIAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_NEGOCIACAO", ordem: 6 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-7",
      titulo: "Follow-up: Negociação",
      tipo: "TAREFA",
      status: "PENDENTE",
      obrigatoria: true,
      metadata: { acao: "DESFECHO_FOLLOW_NEGOCIACAO" },
      templateItem: { acao: "DESFECHO_NEGOCIACAO", ordem: 7 },
      oportunidadeId: MOCK_OPP_ID,
    },
    {
      id: "mock-atv-8",
      titulo: "Cliente iniciou registros?",
      tipo: "TAREFA",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_CONFIRMACAO_INICIO_REGISTROS", ordem: 8 },
      oportunidadeId: MOCK_OPP_ID,
    },
  ],
  "mock-exp-1": [
    {
      id: "mock-exp1-atv-1",
      titulo: "Observar fluxo e-Registro",
      tipo: "TAREFA",
      status: "PENDENTE",
      obrigatoria: false,
      templateItem: { acao: "OBSERVAR_FLUXO_EREGISTRO", ordem: 1 },
      oportunidadeId: "mock-exp-1",
    },
    {
      id: "mock-exp1-atv-2",
      titulo: "Sondagem de expansão",
      tipo: "REUNIAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_SONDAGEM_EXPANSAO", ordem: 2 },
      oportunidadeId: "mock-exp-1",
    },
  ],
  "mock-exp-2": [
    {
      id: "mock-exp2-atv-1",
      titulo: "Negociar condições (expansão UF)",
      tipo: "REUNIAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_NEGOCIACAO", ordem: 1 },
      oportunidadeId: "mock-exp-2",
    },
    {
      id: "mock-exp2-atv-2",
      titulo: "Conferir UFs realizadas",
      tipo: "TAREFA",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "CONFERIR_UFS_EXPANSAO", ordem: 2 },
      oportunidadeId: "mock-exp-2",
    },
  ],
  "mock-exp-3": [
    {
      id: "mock-exp3-atv-1",
      titulo: "Abordagem de volume",
      tipo: "LIGACAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_ABORDAGEM_VOLUME", ordem: 1 },
      oportunidadeId: "mock-exp-3",
    },
    {
      id: "mock-exp3-atv-2",
      titulo: "Reunião de volume",
      tipo: "REUNIAO",
      status: "PENDENTE",
      obrigatoria: false,
      templateItem: { acao: "DESFECHO_REUNIAO_VOLUME", ordem: 2 },
      oportunidadeId: "mock-exp-3",
    },
  ],
  "mock-exp-4": [
    {
      id: "mock-exp4-atv-1",
      titulo: "Entrar em contato (standby)",
      tipo: "LIGACAO",
      status: "PENDENTE",
      obrigatoria: true,
      templateItem: { acao: "DESFECHO_STANDBY_EXPANSAO", ordem: 1 },
      oportunidadeId: "mock-exp-4",
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
