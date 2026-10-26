"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Search,
  Info,
  LoaderCircle,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { publicPath, useResource, fmt, pct, date, fold } from "@/lib/data";
import type {
  Candidate,
  MapData,
  Meta,
  Municipality,
  StateSummary,
  Snapshot,
} from "@/lib/types";

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={
        "badge " +
        (status === "ELEITO"
          ? "elected"
          : status === "2º TURNO"
            ? "round"
            : status === "EM TOTALIZAÇÃO"
              ? "pending"
              : "neutral")
      }
    >
      {status}
    </span>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      {title ? (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
export function Empty({
  title = "Nenhum resultado encontrado",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Info size={24} />
      <h3>{title}</h3>
      <p>{children ?? "Tente outro filtro para continuar a consulta."}</p>
    </div>
  );
}
export function Loading({ error }: { error?: string }) {
  return error ? (
    <Empty title="Dados indisponíveis">
      {error} O último cache válido é preservado em caso de falha na
      atualização.
    </Empty>
  ) : (
    <div className="loading" role="status">
      <LoaderCircle className="spin" />
      Carregando dados locais…
    </div>
  );
}
export function Title({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Stat({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className={"stat " + (accent ? "stat-accent" : "")}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
export function Source({ meta }: { meta: Meta }) {
  return (
    <div className="source-line">
      <span>
        Fonte: TSE · {meta.round}º turno · {meta.sourceTime} ·{" "}
        {meta.final
          ? "Totalização final confirmada"
          : "Totalização final pendente"}
      </span>
      <a href={meta.url} target="_blank" rel="noreferrer">
        Arquivo oficial <ExternalLink size={12} />
      </a>
    </div>
  );
}
export function Progress({ meta }: { meta: Meta }) {
  return (
    <div className="progress-block">
      <div>
        <span>Seções totalizadas</span>
        <strong>{pct(meta.percent)}</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: Math.min(100, meta.percent) + "%" }} />
      </div>
      <small>
        {fmt(meta.counted)} de {fmt(meta.sections)} seções ·{" "}
        {meta.final ? "Totalização final" : "Confirmação final pendente"}
      </small>
    </div>
  );
}
export function StateSelect({
  states,
  value,
  onChange,
  all = true,
}: {
  states: StateSummary[];
  value: string;
  onChange: (s: string) => void;
  all?: boolean;
}) {
  return (
    <label className="field">
      <span>Estado</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {all ? <option value="">Todas as UFs</option> : null}
        {states.map((s) => (
          <option value={s.uf} key={s.uf}>
            {s.name} · {s.uf}
          </option>
        ))}
      </select>
    </label>
  );
}
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="field search-field">
      <span>{label}</span>
      <div>
        <Search size={17} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
export function Person({
  c,
  local = false,
}: {
  c: Candidate;
  local?: boolean;
}) {
  return (
    <div className="person-row">
      <div className="initials" aria-hidden="true">
        {c.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="person-name">
        <strong>
          {c.elected && [5, 6, 7, 8].includes(c.office) ? (
            <Link href={"/deputados/" + c.id}>
              {c.name}
              <ArrowUpRight size={14} />
            </Link>
          ) : (
            c.name
          )}
        </strong>
        <span>
          {c.party} <i /> {c.number}{" "}
          {local ? null : (
            <>
              {" "}
              <i /> {c.uf}
            </>
          )}
        </span>
      </div>
      <div className="vote-value">
        <strong>{fmt(c.votes)}</strong>
        <small>{pct(c.percent)}</small>
      </div>
    </div>
  );
}
export function CandidateTable({
  candidates,
  local = false,
  limit = 10,
  detailSuffix = "",
  preserveRank = false,
}: {
  candidates: Candidate[];
  local?: boolean;
  limit?: number;
  detailSuffix?: "/votos" | "";
  preserveRank?: boolean;
}) {
  const [visible, setVisible] = useState(limit);
  return candidates.length ? (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Candidato</th>
              <th>Partido</th>
              <th className="numeric">Votos</th>
              <th className="numeric">{preserveRank ? "% local" : "%"}</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {candidates.slice(0, visible).map((c, i) => (
              <tr key={c.id}>
                <td className="rank">
                  {preserveRank ? c.rank : local
                    ? i + 1
                    : candidates.findIndex((x) => x.votes === c.votes) + 1}
                </td>
                <td>
                  {c.elected && [5, 6, 7, 8].includes(c.office) ? (
                    <Link className="name-link" href={"/deputados/" + c.id + detailSuffix}>
                      {c.name}
                      <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <strong>{c.name}</strong>
                  )}
                  <small className="cell-note">
                    {c.number} · {c.uf}
                  </small>
                </td>
                <td>{c.party}</td>
                <td className="numeric">
                  <strong>{fmt(c.votes)}</strong>
                </td>
                <td className="numeric">{pct(c.percent)}</td>
                <td>
                  <Badge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible < candidates.length ? (
        <button className="show-more" onClick={() => setVisible((v) => v + 50)}>
          Ver mais ({fmt(candidates.length - visible)} restantes)
          <ArrowRight size={15} />
        </button>
      ) : null}
    </>
  ) : (
    <Empty title="Confirmação de eleitos pendente">
      O TSE ainda não publicou candidatos com situação oficial de eleito para
      esta seleção.
    </Empty>
  );
}
export function BrazilMap({
  states,
  mode = "coverage",
}: {
  states: StateSummary[];
  mode?: "coverage" | "governors" | "president";
}) {
  const { data, error } = useResource<MapData>("/maps/BR.json");
  const [hover, setHover] = useState("");
  if (!data) return <Loading error={error} />;
  const label = hover ? states.find((s) => s.uf === hover) : null;
  const presidential = Array.from(
    new Map(
      states
        .flatMap((s) => s.offices["1"].voteLeaders?.slice(0, 1) ?? [])
        .map((c) => [c.id, c]),
    ).values(),
  ).sort((a, b) => a.id.localeCompare(b.id));
  const colors = ["#597f99", "#b39872", "#769184", "#8f83a5"];
  return (
    <div className="map-area">
      <div className="map-caption">
        <span className="map-dot" />
        {label
          ? `${label.name} · ${fmt(label.municipalities)} municípios`
          : "Selecione um estado no mapa"}
      </div>
      <svg
        viewBox={data.viewBox}
        role="img"
        aria-label="Mapa interativo dos 27 estados do Brasil"
      >
        {data.paths.map((p) => {
          const s = states.find((s) => s.uf === p.uf);
          const governor = s?.offices["3"];
          const hasPending =
            s &&
            Object.entries(s.offices).some(
              ([k, v]) => ["6", "7", "8"].includes(k) && !v.meta.final,
            );
          const fill =
            mode === "governors"
              ? governor?.secondRound
                ? "#b88736"
                : "#5f9a8f"
              : mode === "president"
                ? colors[
                    Math.max(
                      0,
                      presidential.findIndex(
                        (c) => c.id === s?.offices["1"].voteLeaders?.[0]?.id,
                      ),
                    ) % colors.length
                  ]
                : hasPending
                  ? "#c7d1d9"
                  : "#799aaf";
          return (
            <a
              key={p.id}
              href={publicPath("/estados/" + p.uf)}
              aria-label={"Analisar " + p.name}
              onFocus={() => setHover(p.uf ?? "")}
              onMouseEnter={() => setHover(p.uf ?? "")}
              onMouseLeave={() => setHover("")}
            >
              <path d={p.d} fill={fill} className="map-state">
                <title>{p.name}</title>
              </path>
            </a>
          );
        })}
      </svg>
      <div className="map-legend">
        {mode === "president" ? (
          <>
            {presidential.map((c, i) => (
              <span key={c.id}>
                <i style={{ background: colors[i % colors.length] }} />
                {c.name}
              </span>
            ))}
          </>
        ) : mode === "governors" ? (
          <>
            <span>
              <i style={{ background: "#5f9a8f" }} />
              Eleito
            </span>
            <span>
              <i style={{ background: "#b88736" }} />
              2º turno
            </span>
          </>
        ) : (
          <>
            <span>
              <i style={{ background: "#799aaf" }} />
              Deputados definidos
            </span>
            <span>
              <i style={{ background: "#c7d1d9" }} />
              Confirmação pendente
            </span>
          </>
        )}
        <small>Malha: IBGE</small>
      </div>
    </div>
  );
}
export function CityPicker({
  snapshot,
  states,
  initialUF = "",
  browse = false,
}: {
  snapshot: Snapshot;
  states: StateSummary[];
  initialUF?: string;
  browse?: boolean;
}) {
  const [uf, setUF] = useState(initialUF);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(24);
  const { data, error } = useResource<Municipality[]>(
    snapshot.base + "/municipalities.json",
  );
  const matches = (data ?? [])
    .filter(
      (m) =>
        (!uf || m.uf === uf) &&
        (browse || query.length >= 2) &&
        fold(m.name).includes(fold(query.trim())),
    );
  const filtered = browse
    ? matches.sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.uf.localeCompare(b.uf))
    : matches.slice(0, 15);
  return (
    <Panel
      title="Encontre um município"
      description={browse ? "Explore as cidades ou filtre por estado e nome." : "Escolha a UF e digite ao menos duas letras do nome."}
    >
      <div className="filters">
        <StateSelect states={states} value={uf} onChange={v => {setUF(v); setVisible(24);}} />
        <SearchField
          value={query}
          onChange={v => {setQuery(v); setVisible(24);}}
          label={browse ? "Pesquisar município" : "Município"}
          placeholder="Digite o nome da cidade…"
        />
      </div>
      {browse ? !data ? <Loading error={error} /> : <>
        <div className="result-count" role="status">{fmt(filtered.length)} cidades nesta seleção</div>
        {filtered.length ? <div className="city-options">
          {filtered.slice(0, visible).map(m => <Link href={"/municipios/" + m.id} key={m.id} aria-label={`${m.name} / ${m.uf}`}>
            <span><strong>{m.name}</strong><small>{m.uf}{m.capital ? " · Capital" : ""}</small></span>
            <ArrowUpRight size={17} />
          </Link>)}
        </div> : <Empty title="Município não encontrado" />}
        {visible < filtered.length ? <button className="show-more" onClick={() => setVisible(v => v + 48)}>Ver mais cidades</button> : null}
      </> : error ? (
        <Loading error={error} />
      ) : query.length >= 2 ? (
        <div className="search-results" aria-live="polite">
          {filtered.length ? (
            filtered.map((m) => (
              <Link href={"/municipios/" + m.id} key={m.id}>
                <MapPin size={17} />
                <span>
                  {m.name}
                  <small>
                    {m.uf} · {m.region}
                  </small>
                </span>
                <ChevronRight size={17} />
              </Link>
            ))
          ) : (
            <Empty title="Município não encontrado" />
          )}
        </div>
      ) : (
        <div className="search-hint">
          <Search size={22} />
          <p>
            Busque entre {fmt(snapshot.municipalities)} municípios da base
            eleitoral.
          </p>
        </div>
      )}
    </Panel>
  );
}
export function SnapshotStamp({ snapshot }: { snapshot: Snapshot }) {
  return (
    <span className="snapshot-stamp">
      <i />
      Coleta {date(snapshot.collectedAt)} · Brasília
    </span>
  );
}
