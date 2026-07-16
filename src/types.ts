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
export interface Conta {
  id: UUID;
  nome: string;
  documento?: string;
}

export type Pipeline = "AQUISICAO" | "EXPANSAO" | "OPERACOES";
export type Produto = "E_REGISTRO" | "E_BUSCAR";
export type StatusOportunidade = "ABERTA" | "CLOSED_WON" | "CLOSED_LOST";

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
}

export interface OportunidadeListItem {
  id: UUID;
  pipeline: Pipeline;
  produto?: Produto | null;
  estagio: string;
  status: StatusOportunidade;
  valorEstimadoMensal?: number | null;
  previsaoFechamento?: ISODate | null;
  conta?: ContaRef | null;
  owner?: OwnerRef | null;
  ownerId?: UUID | null;
  contaId: UUID;
  criadaEm?: ISODate;
}

export interface Atividade {
  id: UUID;
  oportunidadeId?: UUID;
  contaId?: UUID;
  tipo: string;
  descricao: string;
  data: ISODate;
}

export interface Registradora {
  id: UUID;
  nome: string;
  cnpj?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
