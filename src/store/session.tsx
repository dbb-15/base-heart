// SessionProvider: gerencia access token em memória + persistência leve
// (accessToken em localStorage; refresh token vive em cookie HttpOnly).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { configureApi } from "../services/api";
import { authService } from "../services/auth";
import type { LoginPayload, Role, User } from "../types";

interface SessionState {
  user: User | null;
  accessToken: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

interface SessionContextValue extends SessionState {
  login: (payload: LoginPayload) => Promise<void>;
  devLogin: (user: User) => void;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const TOKEN_KEY = "alias.crm.accessToken";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    user: null,
    accessToken: null,
    status: "loading",
  });
  const tokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, accessToken: token }));
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setState({ user: null, accessToken: null, status: "unauthenticated" });
  }, []);

  // Configura api.ts com getters/setters de token e handler de 401.
  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      setToken: (t) => setAccessToken(t),
      onUnauthorized: () => clearSession(),
    });
  }, [setAccessToken, clearSession]);

  // TEMP: login desativado — auto-autentica com usuário mock ADMIN
  // para desbloquear navegação enquanto o backend não está disponível.
  useEffect(() => {
    const mockUser: User = {
      id: "dev-user",
      nome: "Dev Admin",
      email: "dev@alias.local",
      role: "admin",
    };
    const token = "dev-mock-token";
    tokenRef.current = token;
    setState({ user: mockUser, accessToken: token, status: "authenticated" });
  }, []);

  const login = useCallback<SessionContextValue["login"]>(
    async (payload) => {
      const session = await authService.login(payload);
      setAccessToken(session.accessToken);
      setState({
        user: session.user,
        accessToken: session.accessToken,
        status: "authenticated",
      });
    },
    [setAccessToken],
  );

  const logout = useCallback<SessionContextValue["logout"]>(async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    clearSession();
  }, [clearSession]);

  const devLogin = useCallback<SessionContextValue["devLogin"]>(
    (user) => {
      const token = "dev-mock-token";
      setAccessToken(token);
      setState({ user, accessToken: token, status: "authenticated" });
    },
    [setAccessToken],
  );

  const hasRole = useCallback<SessionContextValue["hasRole"]>(
    (roles) => {
      if (!state.user) return false;
      const list = Array.isArray(roles) ? roles : [roles];
      return list.includes(state.user.role);
    },
    [state.user],
  );

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, login, devLogin, logout, hasRole }),
    [state, login, devLogin, logout, hasRole],
  );


  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
