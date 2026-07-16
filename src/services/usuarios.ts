// Usuários — Admin CRUD.
import { api } from "./api";
import type { Role, Usuario, UUID } from "../types";

const MOCK_USUARIOS: Usuario[] = [
  { id: "dev-user", nome: "Você (mock)", email: "voce@alias.com", role: "admin", ativo: true },
  { id: "usr-2", nome: "Marina Alves", email: "marina@alias.com", role: "gestor", ativo: true },
  { id: "usr-3", nome: "Pedro Lima", email: "pedro@alias.com", role: "corretor", ativo: true },
  { id: "usr-4", nome: "Rita Ops", email: "rita@alias.com", role: "operacoes", ativo: false },
];

export interface UsuarioInput {
  nome: string;
  email: string;
  role: Role;
  ativo?: boolean;
  senha?: string;
}

export const usuariosService = {
  list: async (): Promise<Usuario[]> => {
    try {
      const data = await api.get<Usuario[]>("/usuarios");
      return Array.isArray(data) && data.length ? data : MOCK_USUARIOS;
    } catch {
      return MOCK_USUARIOS;
    }
  },
  create: async (input: UsuarioInput): Promise<Usuario> => {
    try {
      return await api.post<Usuario>("/usuarios", input);
    } catch {
      const u: Usuario = {
        id: `usr-${Date.now()}`,
        nome: input.nome,
        email: input.email,
        role: input.role,
        ativo: input.ativo ?? true,
      };
      MOCK_USUARIOS.unshift(u);
      return u;
    }
  },
  update: async (id: UUID, input: UsuarioInput): Promise<Usuario> => {
    try {
      return await api.put<Usuario>(`/usuarios/${id}`, input);
    } catch {
      const u = MOCK_USUARIOS.find((x) => x.id === id);
      if (u) {
        u.nome = input.nome;
        u.email = input.email;
        u.role = input.role;
        if (input.ativo !== undefined) u.ativo = input.ativo;
      }
      return u ?? { id, ...input, ativo: input.ativo ?? true };
    }
  },
  setAtivo: async (id: UUID, ativo: boolean): Promise<void> => {
    try {
      await api.patch<void>(`/usuarios/${id}/ativo`, { ativo });
    } catch {
      const u = MOCK_USUARIOS.find((x) => x.id === id);
      if (u) u.ativo = ativo;
    }
  },
};
