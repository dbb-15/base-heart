// Labels em pt-BR para exibição de enums e chaves de domínio.
import type { Role, TipoAtividade, StatusAtividade, StatusConta, Segmento } from "./types";

export const STATUS_CONTA_LABEL: Record<StatusConta, string> = {
  PROSPECT: "Prospect",
  CLIENTE: "Cliente",
  INATIVO: "Inativo",
};

export const SEGMENTO_LABEL: Record<Segmento, string> = {
  BANCO: "Banco",
  FINANCEIRA: "Financeira",
  COOPERATIVA: "Cooperativa",
  CONSORCIO: "Consórcio",
  CONCESSIONARIA: "Concessionária",
  REVENDA: "Revenda",
  OUTROS: "Outros",
};


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
