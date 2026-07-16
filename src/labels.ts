// Labels em pt-BR para exibição de enums e chaves de domínio.
import type { EtapaFunil, TipoAtividade, Desfecho } from "./domain";
import type { Role } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  operacoes: "Operações",
  corretor: "Corretor",
  registradora: "Registradora",
};

export const ETAPA_LABEL: Record<EtapaFunil, string> = {
  prospeccao: "Prospecção",
  qualificacao: "Qualificação",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechamento: "Fechamento",
};

export const ATIVIDADE_LABEL: Record<TipoAtividade, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  tarefa: "Tarefa",
  nota: "Nota",
};

export const DESFECHO_LABEL: Record<Desfecho, string> = {
  ganho: "Ganho",
  perdido: "Perdido",
  sem_contato: "Sem contato",
  adiado: "Adiado",
};

export const NAV_LABEL = {
  home: "Início",
  base: "Base",
  grupos: "Grupos",
  funil: "Funil",
  operacoes: "Operações",
  atividades: "Atividades",
  admin: "Administração",
  registradoras: "Registradoras",
  configuracoes: "Configurações",
};
