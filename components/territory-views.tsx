import Link from "next/link";
import { MapPin, Users } from "lucide-react";

export type TerritoryView = "leaders" | "votes";

export function TerritoryViews({
  baseHref,
  cities = false,
}: {
  baseHref: string;
  cities?: boolean;
}) {
  return (
    <div className="territory-views" role="group" aria-label="Tipo de consulta territorial">
      {([
        { key: "deputies", label: "Deputados", description: "Escolha um eleito e veja todas as cidades onde recebeu votos, com suas lideranças.", Icon: Users },
        { key: "cities", label: "Cidades", description: "Escolha uma cidade e veja todos os candidatos votados, eleitos e não eleitos.", Icon: MapPin },
      ] as const).map(({ key, label, description, Icon }) => (
        <Link
          key={key}
          href={baseHref + (key === "cities" ? "/cidades" : "")}
          className={"territory-view " + (cities === (key === "cities") ? "selected" : "")}
          aria-label={label}
          aria-describedby={`territory-description-${key}`}
          aria-current={cities === (key === "cities") ? "page" : undefined}
        >
          <Icon size={21} aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <span id={`territory-description-${key}`}>{description}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
