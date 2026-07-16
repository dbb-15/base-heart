// Domain types shared across the CRM front-end.
// Backend Fastify is the source of truth; keep these aligned with API contracts.

export type UUID = string;
export type ISODate = string;

export type Role =
  | "admin"
  | "gestor"
  | "operacoes"
  | "corretor"
  | "registradora";

export interface User {
  id: UUID;
  nome: string;
  email: string;
  role: Role;
  registradoraId?: UUID | null;
}

export interface Session {
  user: User;
  accessToken: string;
}

export interface AuthTokens {
  accessToken: string;
  // refresh token is delivered via HttpOnly cookie
}

export interface LoginPayload {
  email: string;
  senha: string;
}

// Placeholder domain shapes — refine when wiring real endpoints.
export type StatusConta = "PROSPECT" | "CLIENTE" | "INATIVO";

export type Segmento =
  | "BANCO"
  | "FINANCEIRA"
  | "COOPERATIVA"
  | "CONSORCIO"
  | "CONCESSIONARIA"
  | "REVENDA"
  | "OUTROS";

export interface GrupoFinanceiro {
  id: UUID;
  nome: string;
  descricao?: string | null;
  totalContas?: number;
}

export interface Conta {
  id: UUID;
  nome?: string;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  status?: StatusConta;
  documento?: string;
  segmento?: Segmento | null;
  grupoId?: UUID | null;
  grupoNome?: string | null;
  ownerId?: UUID | null;
  ownerNome?: string | null;
  uf?: string | null;
  municipio?: string | null;
  criadaEm?: ISODate;
}

export interface Contato {
  id: UUID;
  contaId: UUID;
  nome: string;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  principal?: boolean;
  anotacoes?: string | null;
}


export type Pipeline = "AQUISICAO" | "EXPANSAO" | "OPERACOES";
export type Produto = "E_REGISTRO" | "E_BUSCAR";
export type StatusOportunidade = "ABERTA" | "CLOSED_WON" | "CLOSED_LOST";
export type TipoExpansao = "UF" | "VOLUME" | "STANDBY";

export interface Oportunidade {
  id: UUID;
  contaId: UUID;
  titulo: string;
  etapa: string;
  valor?: number;
  criadaEm: ISODate;
}

export interface OwnerRef {
  id: UUID;
  nome: string;
}

export interface ContaRef {
  id: UUID;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
  status?: StatusConta;
}

export interface OportunidadeListItem {
  id: UUID;
  pipeline: Pipeline;
  produto?: Produto | null;
  estagio: string;
  status: StatusOportunidade;
  valorEstimadoMensal?: number | null;
  previsaoFechamento?: ISODate | null;
  tipoExpansao?: TipoExpansao | null;
  conta?: ContaRef | null;
  owner?: OwnerRef | null;
  ownerId?: UUID | null;
  contaId: UUID;
  criadaEm?: ISODate;
}


export type StatusAtividade =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "IGNORADA"
  | "CANCELADA";

export type TipoAtividade =
  | "LIGACAO"
  | "EMAIL"
  | "WHATSAPP"
  | "DEMO"
  | "REUNIAO"
  | "TAREFA";

export type AcaoAtividade =
  | "NENHUMA"
  | "DESFECHO_PRIMEIRO_CONTATO"
  | "QUALIFICACAO_FORM"
  | "DESFECHO_RETORNO_EMAIL"
  | "DESFECHO_DEMO"
  | "ANEXAR_PROPOSTA"
  | "DESFECHO_PROPOSTA"
  | "DESFECHO_NEGOCIACAO"
  | "DESFECHO_FOLLOW_NEGOCIACAO"
  | "CONFERIR_UFS_EXPANSAO"
  | "DESFECHO_FORMALIZACAO"
  | "REGISTRAR_CHAMADO_JURIDICO"
  | "DESFECHO_CHAMADO_JURIDICO"
  | "DESFECHO_SOLICITACAO_CADASTRO"
  | "DESFECHO_RECUPERACAO_LEAD"
  | "DESFECHO_SONDAGEM_EXPANSAO"
  | "OBSERVAR_FLUXO_EREGISTRO"
  | "DESFECHO_ABORDAGEM_VOLUME"
  | "DESFECHO_REUNIAO_VOLUME"
  | "DESFECHO_STANDBY_EXPANSAO"
  | "CONFIRMAR_BOAS_VINDAS_OPERACOES"
  | "DESFECHO_ACOMPANHAMENTO_REGISTROS"
  | "DESFECHO_CONFIRMACAO_INICIO_REGISTROS"
  | "CONFIRMAR_RETORNO"
  | "REGISTRAR_CONTATO"
  | "REGISTRAR_NOTA";

export interface TemplateItem {
  acao?: AcaoAtividade;
  titulo?: string;
  ordem?: number;
}

export interface AtividadeListItem {
  id: UUID;
  titulo: string;
  tipo: TipoAtividade;
  status: StatusAtividade;
  dataHora?: ISODate | null;
  obrigatoria?: boolean;
  metadata?: Record<string, unknown> | null;
  templateItem?: TemplateItem | null;
  owner?: OwnerRef | null;
  oportunidadeId?: UUID;
  contaId?: UUID;
}

// Legacy alias — pages antigas.
export interface Atividade {
  id: UUID;
  oportunidadeId?: UUID;
  contaId?: UUID;
  tipo: string;
  descricao: string;
  data: ISODate;
}

export interface WorkflowItemAtual {
  atividadeId: UUID;
  titulo: string;
  obrigatoria: boolean;
  concluida: boolean;
}

export interface WorkflowAtual {
  estagio: string;
  totalObrigatorias: number;
  concluidasObrigatorias: number;
  pendentes: WorkflowItemAtual[];
}

export interface Nota {
  id: UUID;
  texto: string;
  criadaEm: ISODate;
  contatoId?: UUID | null;
  contatoNome?: string | null;
  autorNome?: string | null;
  tipo?: "COMUM" | "CADASTRO_CONTATO" | null;
}

export interface TimelineItem {
  id: string;
  tipo: "ATIVIDADE" | "EVENTO" | "NOTA";
  titulo: string;
  descricao?: string;
  data: ISODate;
  autorNome?: string | null;
}

export interface Registradora {
  id: UUID;
  nome: string;
  cnpj?: string;
  nomeEmpresarial?: string | null;
  nomeFantasia?: string | null;
  tipo?: "MATRIZ" | "FILIAL" | null;
  dataAbertura?: string | null;
  porte?: string | null;
  situacaoCadastral?: string | null;
  cnaePrincipalCodigo?: string | null;
  cnaePrincipalDescricao?: string | null;
  cnaesSecundarios?: string | null;
  naturezaJuridicaCodigo?: string | null;
  naturezaJuridicaDescricao?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  email?: string | null;
  telefone?: string | null;
  dataSituacaoCadastral?: string | null;
  motivoSituacaoCadastral?: string | null;
  efr?: string | null;
  situacaoEspecial?: string | null;
  dataSituacaoEspecial?: string | null;
  deletedAt?: string | null;
}

export interface Usuario {
  id: UUID;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
}

export interface Cadencia {
  primeiroContatoDias: number;
  retornoEmailDias: number;
  retornoPropostaDias: number;
  negociacaoDias: number;
  recuperacaoLeadDias: number;
  standbyExpansaoDias: number;
}


export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
