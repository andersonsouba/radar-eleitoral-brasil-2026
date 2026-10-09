import { MapPin, ShieldCheck } from "lucide-react";
import { fmt } from "@/lib/data";

export type TerritoryView = "leaders" | "votes";

export function TerritoryViews({
  value,
  onChange,
  counts,
}: {
  value: TerritoryView;
  onChange: (view: TerritoryView) => void;
  counts?: { leaders: number; votes: number };
}) {
  return (
    <div className="territory-views" role="group" aria-label="Tipo de consulta territorial">
      {([
        { key: "leaders", label: "Onde liderou", description: "Cidades onde foi o mais votado entre os eleitos do cargo, incluindo empates.", Icon: ShieldCheck },
        { key: "votes", label: "Onde recebeu votos", description: "Todas as cidades com pelo menos um voto, mesmo sem liderança.", Icon: MapPin },
      ] as const).map(({ key, label, description, Icon }) => (
        <button
          key={key}
          type="button"
          className={"territory-view " + (value === key ? "selected" : "")}
          aria-label={label}
          aria-describedby={`territory-description-${key}`}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          <Icon size={21} aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <span id={`territory-description-${key}`}>{description}</span>
          </span>
          {counts ? <b className="territory-view-count">{fmt(counts[key])}<small>cidades</small></b> : null}
        </button>
      ))}
    </div>
  );
}
