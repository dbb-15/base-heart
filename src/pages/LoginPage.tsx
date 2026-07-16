// Tela de login. Suporta modo mock via VITE_MOCK_LOGIN=1 para permitir
// desenvolvimento sem o backend Fastify ativo.
import { useState, type FormEvent } from "react";
import { useSession } from "../store/session";
import { ApiError } from "../services/api";

const MOCK_ENABLED = import.meta.env.VITE_MOCK_LOGIN === "1";

export function LoginPage() {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, senha });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Falha ao autenticar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function mockLogin() {
    setError(null);
    setLoading(true);
    try {
      // Injeta uma sessão fake diretamente no store via login endpoint mock.
      // Como não há backend, simulamos throw + set via storage.
      const fakeToken = "mock-token";
      window.localStorage.setItem("alias.crm.accessToken", fakeToken);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-card-foreground">Alias CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com suas credenciais.
        </p>

        <label className="mt-6 block text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="mt-4 block text-sm font-medium text-foreground">
          Senha
        </label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {MOCK_ENABLED ? (
          <button
            type="button"
            onClick={mockLogin}
            className="mt-3 w-full rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            Entrar (mock)
          </button>
        ) : null}
      </form>
    </div>
  );
}
