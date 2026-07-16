// Labels em pt-BR para exibição de enums e chaves de domínio.
import type { Role, TipoAtividade, StatusAtividade } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  operacoes: "Operações",
  corretor: "Corretor",
  registradora: "Registradora",
};

export const TIPO_ATIVIDADE_LABEL: Record<TipoAtividade, string> = {
  LIGACAO: "Ligação",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  DEMO: "Demo",
  REUNIAO: "Reunião",
  TAREFA: "Tarefa",
};

export const STATUS_ATIVIDADE_LABEL: Record<StatusAtividade, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  IGNORADA: "Ignorada",
  CANCELADA: "Cancelada",
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
