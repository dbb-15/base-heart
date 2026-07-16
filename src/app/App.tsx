// App shell: monta SessionProvider + roteamento por hash.
import { useHashRoute, matchRoute } from "../hooks/useHashRoute";
import { SessionProvider, useSession } from "../store/session";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { FunilPage } from "../pages/FunilPage";
import {
  AdminPage,
  AtividadesPage,
  BasePage,
  ConfiguracoesPage,
  ContaDetailPage,
  GruposPage,
  NotFoundPage,
  OperacoesPage,
  OportunidadeDetailPage,
  RegistradorasPage,
} from "../pages/placeholders";

function Router() {
  const route = useHashRoute();

  if (route.path === "/") return <HomePage />;
  if (route.path === "/base") return <BasePage />;
  if (route.path === "/grupos") return <GruposPage />;
  if (route.path === "/funil") return <FunilPage />;
  if (route.path === "/operacoes") return <OperacoesPage />;
  if (route.path === "/atividades") return <AtividadesPage />;
  if (route.path === "/admin") return <AdminPage />;
  if (route.path === "/admin/registradoras") return <RegistradorasPage />;
  if (route.path === "/configuracoes") return <ConfiguracoesPage />;
  if (matchRoute("/oportunidades/:id", route)) return <OportunidadeDetailPage />;
  if (matchRoute("/contas/:id", route)) return <ContaDetailPage />;
  return <NotFoundPage />;
}

function Gate() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (status === "unauthenticated") return <LoginPage />;

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}
