import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 pb-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>;
}

export function Placeholder({ note }: { note?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      {note ?? "Em construção — próxima rodada."}
    </div>
  );
}
