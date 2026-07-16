import { PageHeader, PageShell, Placeholder } from "../components/PageShell";

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

export function NotFoundPage() {
  return (
    <PageShell>
      <PageHeader title="Página não encontrada" />
      <Placeholder note="Verifique a URL ou volte ao início." />
    </PageShell>
  );
}

