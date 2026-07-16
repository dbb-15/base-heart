import { PageHeader, PageShell, Placeholder } from "../components/PageShell";
import { useSession } from "../store/session";
import { ROLE_LABEL } from "../labels";

export function HomePage() {
  const { user } = useSession();
  return (
    <PageShell>
      <PageHeader
        title={`Olá, ${user?.nome ?? ""}`}
        description={user ? `Perfil: ${ROLE_LABEL[user.role]}` : undefined}
      />
      <Placeholder note="Dashboard inicial — próximos indicadores serão adicionados aqui." />
    </PageShell>
  );
}
