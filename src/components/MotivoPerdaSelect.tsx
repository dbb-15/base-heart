// Select de motivo de perda + campo "outro" quando aplicável.
import { MOTIVOS_PERDA } from "../domain";

interface Props {
  value: string;
  detalhe: string;
  onChange: (value: string, detalhe: string) => void;
  error?: string | null;
}

export function MotivoPerdaSelect({ value, detalhe, onChange, error }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Motivo da perda
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value, detalhe)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Selecione…</option>
          {MOTIVOS_PERDA.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      {value === "OUTRO" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Descreva o motivo
          </label>
          <textarea
            value={detalhe}
            onChange={(e) => onChange(value, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
