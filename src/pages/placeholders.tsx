import { PageHeader, PageShell, Placeholder } from "../components/PageShell";
import { useHashRoute, matchRoute } from "../hooks/useHashRoute";

export function BasePage() {
  return (
    <PageShell>
      <PageHeader title="Base" description="Contas e cadastros." />
      <Placeholder />
    </PageShell>
  );
}

export function GruposPage() {
  return (
    <PageShell>
      <PageHeader title="Grupos" />
      <Placeholder />
    </PageShell>
  );
}


export function OperacoesPage() {
  return (
    <PageShell>
      <PageHeader title="Operações" />
      <Placeholder />
    </PageShell>
  );
}

export function AtividadesPage() {
  return (
    <PageShell>
      <PageHeader title="Atividades" />
      <Placeholder />
    </PageShell>
  );
}

export function AdminPage() {
  return (
    <PageShell>
      <PageHeader title="Administração" />
      <Placeholder />
    </PageShell>
  );
}

export function RegistradorasPage() {
  return (
    <PageShell>
      <PageHeader title="Registradoras" />
      <Placeholder />
    </PageShell>
  );
}

export function ConfiguracoesPage() {
  return (
    <PageShell>
      <PageHeader title="Configurações" />
      <Placeholder />
    </PageShell>
  );
}

export function OportunidadeDetailPage() {
  const route = useHashRoute();
  const params = matchRoute("/oportunidades/:id", route);
  return (
    <PageShell>
      <PageHeader
        title="Oportunidade"
        description={params?.id ? `ID: ${params.id}` : undefined}
      />
      <Placeholder />
    </PageShell>
  );
}

export function ContaDetailPage() {
  const route = useHashRoute();
  const params = matchRoute("/contas/:id", route);
  return (
    <PageShell>
      <PageHeader
        title="Conta"
        description={params?.id ? `ID: ${params.id}` : undefined}
      />
      <Placeholder />
    </PageShell>
  );
}

export function NotFoundPage() {
  return (
    <PageShell>
      <PageHeader title="Página não encontrada" />
      <Placeholder note="Verifique a URL ou volte ao início." />
    </PageShell>
  );
}
