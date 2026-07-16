// Componentes visuais compartilhados de feedback (loading, erro, vazio)
// + KpiCard e SectionCard usados no Dashboard e Relatórios.
import type { ReactNode } from "react";
import { ApiError } from "../services/api";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-10 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        {label}
      </span>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const msg =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
      ? error.message
      : "Falha ao carregar dados.";
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
      <div className="font-medium text-destructive">Erro ao carregar</div>
      <div className="mt-1 text-muted-foreground">{msg}</div>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description ? (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warn" | "danger";
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-600",
    warn: "text-amber-600",
    danger: "text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneCls[tone]}`}>{value}</div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
