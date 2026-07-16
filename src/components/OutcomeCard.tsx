// Card clicável usado no DesfechoAtividadeModal.
// Variantes: success (verde, avança), warn (âmbar, follow), danger (vermelho, perda), primary (azul).
type Variant = "success" | "primary" | "warn" | "danger";

const STYLES: Record<Variant, { dot: string; ring: string; hover: string }> = {
  success: {
    dot: "bg-emerald-500",
    ring: "hover:border-emerald-400 hover:bg-emerald-50/50",
    hover: "focus-visible:ring-emerald-300",
  },
  primary: {
    dot: "bg-blue-500",
    ring: "hover:border-blue-400 hover:bg-blue-50/50",
    hover: "focus-visible:ring-blue-300",
  },
  warn: {
    dot: "bg-amber-500",
    ring: "hover:border-amber-400 hover:bg-amber-50/50",
    hover: "focus-visible:ring-amber-300",
  },
  danger: {
    dot: "bg-red-500",
    ring: "hover:border-red-400 hover:bg-red-50/50",
    hover: "focus-visible:ring-red-300",
  },
};

interface OutcomeCardProps {
  variant: Variant;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export function OutcomeCard({
  variant,
  title,
  subtitle,
  disabled,
  selected,
  onClick,
}: OutcomeCardProps) {
  const s = STYLES[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-sm transition ${s.ring} focus:outline-none focus-visible:ring-2 ${s.hover} ${
        selected ? "border-foreground/30" : "border-border"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
      <span className="flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </button>
  );
}
