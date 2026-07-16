import { PageHeader, PageShell, Placeholder } from "../components/PageShell";

export function AtividadesPage() {
  return (
    <PageShell>
      <PageHeader title="Atividades" />
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

