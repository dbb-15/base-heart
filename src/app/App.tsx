// App shell: monta SessionProvider + roteamento por hash.
import { useHashRoute, matchRoute } from "../hooks/useHashRoute";
import { SessionProvider, useSession } from "../store/session";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { FunilPage } from "../pages/FunilPage";
import { OportunidadeDetailPage } from "../pages/OportunidadeDetailPage";
import {
  AtividadesPage,
  NotFoundPage,
} from "../pages/placeholders";
import { BasePage } from "../pages/BasePage";
import { ContaDetailPage } from "../pages/ContaDetailPage";
import { GruposPage } from "../pages/GruposPage";
import { AdminPage } from "../pages/AdminPage";
import { ConfiguracoesPage } from "../pages/ConfiguracoesPage";
import { OperacoesPage } from "../pages/OperacoesPage";

function Router() {
  const route = useHashRoute();

  if (route.path === "/") return <HomePage />;
  if (route.path === "/base") return <BasePage />;
  if (route.path === "/grupos") return <GruposPage />;
  if (route.path === "/funil" || route.path === "/funil/aquisicao")
    return <FunilPage pipeline="AQUISICAO" />;
  if (route.path === "/funil/expansao") return <FunilPage pipeline="EXPANSAO" />;
  if (route.path === "/operacoes") return <OperacoesPage />;
  if (route.path === "/atividades") return <AtividadesPage />;
  if (route.path === "/admin") return <AdminPage />;
  if (route.path === "/admin/registradoras") return <AdminPage />;
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
