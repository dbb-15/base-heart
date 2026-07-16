import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { App } from "../app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alias CRM" },
      { name: "description", content: "CRM Alias — operação, funil e atividades." },
      { property: "og:title", content: "Alias CRM" },
      { property: "og:description", content: "CRM Alias — operação, funil e atividades." },
    ],
  }),
  component: IndexRoute,
});

function IndexRoute() {
  // Hash routing e localStorage são client-only: monte após hidratação.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }
  return <App />;
}
