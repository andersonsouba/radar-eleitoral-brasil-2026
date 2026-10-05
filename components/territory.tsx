"use client";
import Link from "next/link";
import { useState } from "react";
import {
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Check,
  ArrowRight,
} from "lucide-react";
import { publicPath, useResource, fmt, pct, officeName, fold } from "@/lib/data";
import type {
  Candidate,
  City,
  Snapshot,
  Overview,
  Leadership,
  CandidateDetail,
  MapData,
} from "@/lib/types";
import {
  Badge,
  Panel,
  Empty,
  Loading,
  Title,
  Stat,
  Source,
  StateSelect,
  SearchField,
  Person,
  CandidateTable,
} from "./ui";
export function CityPage({ snapshot, id }: { snapshot: Snapshot; id: string }) {
  const { data: c, error } = useResource<City>(
    snapshot.base + "/municipalities/" + encodeURIComponent(id) + ".json",
  );
  if (!c) return <Loading error={error} />;
  const regional = c.uf === "DF" ? "8" : "7";
  const turnout = c.results["1"].meta;
  return (
    <>
      <Title
        eyebrow={"FICHA ELEITORAL / " + c.uf}
        title={`${c.name} / ${c.uf}`}
        description={`${c.region} · Código TSE ${c.tse} · IBGE ${c.ibge ?? "não reconciliado"}`}
        action={
          <Link className="button secondary" href={"/municipios/" + c.uf}>
            Buscar outra cidade <MapPin size={16} />
          </Link>
        }
      />
      <div className="notice">
        <ShieldCheck size={20} />
        <span>
          <strong>Liderança entre eleitos.</strong> Cada cargo apresenta apenas
          o maior voto municipal entre deputados oficialmente eleitos. Empates
          são sinalizados.
        </span>
      </div>
      <div className="leader-grid">
        <LeaderCard
          leadership={c.leaders[regional]}
          title={
            c.uf === "DF"
              ? "Deputado Distrital eleito"
              : "Deputado Estadual eleito"
          }
        />
        <LeaderCard
          leadership={c.leaders["6"]}
          title="Deputado Federal eleito"
        />
      </div>
      <div className="stats-grid three">
        <Stat
          label="Comparecimento"
          value={pct(turnout.turnoutPercent)}
          note={fmt(turnout.turnout) + " eleitores"}
        />
        <Stat
          label="Abstenção"
          value={pct(turnout.abstentionPercent)}
          note={fmt(turnout.abstention) + " eleitores"}
        />
        <Stat
          label="Seções totalizadas · Presidente"
          value={pct(turnout.percent)}
          note={fmt(turnout.counted) + " de " + fmt(turnout.sections)}
        />
      </div>
      <Panel
        title="Votação local nos cargos majoritários"
        description="A preferência local não determina quem foi eleito para o cargo."
      >
        <div className="majoritarian-grid">
          {[1, 3, 5].map((office) => {
            const r = c.results[String(office)];
            const cutoff =
              r.candidates[
                Math.min(r.candidates.length, office === 5 ? r.seats : 1) - 1
              ]?.votes ?? 0;
            return (
              <div key={office}>
                <h3>
                  {officeName(office)} ·{" "}
                  {office === 5 ? "mais votados" : "mais votado"}
                </h3>
                {r.candidates
                  .filter((x) => x.votes >= cutoff && x.votes > 0)
                  .map((candidate) => (
                    <div key={candidate.id}>
                      <Person c={candidate} local />
                      <Badge status={candidate.status} />
                    </div>
                  ))}
                <Source meta={r.meta} />
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Partido mais votado por cargo"
        description="Votos válidos nominais + legenda, quando aplicável. Empates preservados."
      >
        <div className="party-local">
          {Object.entries(c.partyLeaders).map(([office, parties]) => (
            <div key={office}>
              <span>{officeName(Number(office))}</span>
              <strong>
                {parties.map((p) => p.party).join(" / ") || "Sem votos válidos"}
              </strong>
              <small>
                {parties.length ? fmt(parties[0].votes) + " votos" : ""}
                {parties.length > 1 ? " · Empate" : ""}
              </small>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
function LeaderCard({
  leadership: l,
  title,
}: {
  leadership: Leadership;
  title: string;
}) {
  return (
    <Panel
      title={title}
      description="Líder entre os eleitos nesta cidade"
      className="leader-card"
    >
      {l.status === "pending" ? (
        <Empty title="Confirmação de eleitos pendente">
          O arquivo estadual ainda não permite identificar um deputado
          oficialmente eleito para este cargo.
        </Empty>
      ) : l.status === "no_votes" ? (
        <Empty title="Sem votos para os eleitos">
          Não há liderança territorial com votos positivos para este cargo nesta
          cidade.
        </Empty>
      ) : (
        <>
          {l.status === "tie" ? (
            <div className="notice warning compact">
              Empate real: {l.leaders.length} deputados eleitos têm a mesma
              votação. Nenhum desempate foi aplicado.
            </div>
          ) : (
            <span className="leader-kicker">
              <Check size={15} /> LÍDER MUNICIPAL
            </span>
          )}
          {l.leaders.map((c) => (
            <div className="leader-person" key={c.id}>
              <div className="leader-avatar">
                {c.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <h3>{c.name}</h3>
              <p>
                {c.party} · {c.number} · {c.uf}
              </p>
              <Badge status="ELEITO" />
              <div className="leader-numbers">
                <div>
                  <strong>{fmt(c.votes)}</strong>
                  <span>votos na cidade</span>
                </div>
                <div>
                  <strong>{pct(c.percent)}</strong>
                  <span>dos votos válidos do cargo</span>
                </div>
              </div>
              <div className="leader-state">
                <span>{fmt(c.stateVotes)} votos na UF</span>
                <span>{c.electedRank}º entre os eleitos na UF</span>
              </div>
              <Link
                className="button secondary full"
                href={"/deputados/" + c.id}
              >
                Ver território do deputado <ArrowUpRight size={16} />
              </Link>
            </div>
          ))}
        </>
      )}
      <Source meta={l.meta} />
      {l.officialMeta ? (
        <a
          className="small-link"
          href={l.officialMeta.url}
          target="_blank"
          rel="noreferrer"
        >
          Situação oficial de eleição: arquivo da UF
        </a>
      ) : null}
    </Panel>
  );
}
export function DeputiesPage({
  snapshot,
  overview,
  offices,
}: {
  snapshot: Snapshot;
  overview: Overview;
  offices: number[];
}) {
  const { data, error } = useResource<Candidate[]>(
    snapshot.base + "/candidates.json",
  );
  const [uf, setUF] = useState("");
  const [query, setQuery] = useState("");
  const filtered = (data ?? [])
    .filter(
      (c) =>
        offices.includes(c.office) &&
        (!uf || c.uf === uf) &&
        fold(c.name + " " + c.party).includes(fold(query)),
    )
    .sort((a, b) => b.votes - a.votes);
  return (
    <>
      <Title
        eyebrow="PARLAMENTARES ELEITOS"
        title={
          offices[0] === 5
            ? "Senado Federal"
            : offices[0] === 6
              ? "Deputados Federais"
              : "Deputados Estaduais e Distritais"
        }
        description="Selecione um eleito para abrir seu mapa territorial e a distribuição municipal de votos."
      />
      <Panel>
        <div className="filters">
          <StateSelect states={overview.states} value={uf} onChange={setUF} />
          <SearchField
            value={query}
            onChange={setQuery}
            label="Parlamentar ou partido"
            placeholder="Busque por nome ou sigla…"
          />
        </div>
        {!data ? (
          <Loading error={error} />
        ) : (
          <>
            <div className="result-count">
              {fmt(filtered.length)} eleitos nesta seleção · ordenados por votos
              totais
            </div>
            <CandidateTable key={uf + query} candidates={filtered} />
          </>
        )}
      </Panel>
      {offices[0] === 5 ? (
        <div className="notice">
          As vagas são lidas do campo oficial de cada UF. A situação de eleito
          vem da totalização do TSE.
        </div>
      ) : null}
    </>
  );
}
export function DeputyPage({
  snapshot,
  id,
}: {
  snapshot: Snapshot;
  id: string;
}) {
  const { data: d, error } = useResource<CandidateDetail>(
    snapshot.base + "/candidates/" + encodeURIComponent(id) + ".json",
  );
  const [mode, setMode] = useState("leaders");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(10);
  if (!d) return <Loading error={error} />;
  const c = d.candidate;
  const activeMode = c.office === 5 && mode === "leaders" ? "votes" : mode;
  const rows = d.cities
    .filter(
      (m) =>
        (activeMode !== "leaders" || m.leader) &&
        fold(m.name).includes(fold(query)),
    )
    .sort((a, b) =>
      activeMode === "percent"
        ? (b.percent ?? 0) - (a.percent ?? 0)
        : b.votes - a.votes,
    );
  return (
    <>
      <Title
        eyebrow={`${officeName(c.office).toLocaleUpperCase("pt-BR")} / ${c.uf}`}
        title={c.name}
        description={`${c.party} · Número ${c.number} · ${c.fullName}`}
        action={<Badge status={c.status} />}
      />
      <div className="stats-grid four">
        <Stat
          label="Votos totais na UF"
          value={fmt(c.votes)}
          note={`${c.electedRank}º entre os eleitos na UF`}
          accent
        />
        <Stat
          label="Municípios com votos"
          value={fmt(d.receivedCount)}
          note="Votação nominal positiva"
        />
        <Stat
          label="Lideranças municipais"
          value={c.office === 5 ? "—" : fmt(d.leaderCount)}
          note={
            c.office === 5
              ? "Métrica reservada a deputados"
              : fmt(d.tiedCount) + " empates, contados à parte"
          }
        />
        <Stat
          label="Concentração · Top 10 cidades"
          value={d.consistent ? pct(d.concentration10) : "—"}
          note={
            d.consistent
              ? "Top 5: " + pct(d.concentration5)
              : "Agregados divergentes; métrica suspensa"
          }
        />
      </div>
      {!d.consistent ? (
        <div className="notice warning">
          A soma municipal difere da votação estadual neste snapshot. As
          métricas de concentração estão suspensas até a reconciliação.
        </div>
      ) : null}
      <Panel
        title="Onde este parlamentar foi mais votado?"
        description={
          c.office === 5
            ? "Distribuição municipal de votos."
            : "A liderança compara somente os deputados oficialmente eleitos do mesmo cargo."
        }
      >
        <div className="tabs" aria-label="Métrica territorial">
          {(c.office === 5
            ? [
                ["votes", "Votos absolutos"],
                ["percent", "Percentual local"],
              ]
            : [
                ["leaders", "Liderança entre eleitos"],
                ["votes", "Votos absolutos"],
                ["percent", "Percentual local"],
              ]
          ).map(([value, label]) => (
            <button
              key={value}
              className={activeMode === value ? "selected" : ""}
              onClick={() => {
                setMode(value);
                setVisible(10);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="territory-grid">
          <TerritoryMap detail={d} mode={activeMode} />
          <div>
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setVisible(10);
              }}
              label="Pesquisar cidade"
              placeholder="Nome do município…"
            />
            <div className="result-count">
              {fmt(rows.length)} cidades ·{" "}
              {activeMode === "leaders"
                ? "lideranças exclusivas e empates"
                : activeMode === "percent"
                  ? "maior participação local"
                  : "maior votação absoluta"}
            </div>
            {rows.length ? (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Cidade</th>
                        <th className="numeric">Votos</th>
                        <th className="numeric">% local</th>
                        {c.office !== 5 ? <th>Entre eleitos</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, visible).map((m) => (
                        <tr key={m.id}>
                          <td>
                            <Link
                              className="name-link"
                              href={"/municipios/" + m.id}
                            >
                              {m.name}
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                          <td className="numeric">{fmt(m.votes)}</td>
                          <td className="numeric">{pct(m.percent)}</td>
                          {c.office !== 5 ? (
                            <td>
                              {m.votes === 0
                                ? "Sem votos"
                                : m.tie
                                  ? "1º · Empate"
                                  : `${m.rank}º`}
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visible < rows.length ? (
                  <button
                    className="show-more"
                    onClick={() => setVisible((v) => v + 50)}
                  >
                    Ver mais cidades <ArrowRight size={15} />
                  </button>
                ) : null}
              </>
            ) : (
              <Empty title="Nenhuma cidade nesta seleção" />
            )}
          </div>
        </div>
        <Source meta={d.meta} />
      </Panel>
    </>
  );
}
function TerritoryMap({
  detail,
  mode,
}: {
  detail: CandidateDetail;
  mode: string;
}) {
  const { data, error } = useResource<MapData>(
    "/maps/" + detail.candidate.uf + ".json",
  );
  const [hover, setHover] = useState("");
  if (!data) return <Loading error={error} />;
  const byId = new Map(detail.cities.map((c) => [c.ibge, c]));
  const max = Math.max(
    1,
    ...detail.cities.map((c) =>
      mode === "percent" ? (c.percent ?? 0) : c.votes,
    ),
  );
  const mapIds = new Set(data.paths.map((p) => p.id));
  const missing = detail.cities.filter((c) => !mapIds.has(c.ibge ?? ""));
  return (
    <div className="territory-map">
      <div className="map-caption">
        <MapPin size={14} />
        {hover || "Passe sobre uma cidade"}
      </div>
      <svg
        viewBox={data.viewBox}
        role="img"
        aria-label={"Mapa territorial de " + detail.candidate.name}
      >
        {data.paths.map((p) => {
          const c = byId.get(p.id);
          const value = c
            ? mode === "percent"
              ? (c.percent ?? 0)
              : c.votes
            : 0;
          const opacity =
            mode === "leaders"
              ? c?.leader
                ? 1
                : 0.15
              : 0.15 + 0.85 * Math.sqrt(value / max);
          return (
            <a
              key={p.id}
              href={c ? publicPath("/municipios/" + c.id) : undefined}
              aria-label={c?.name ?? "Área sem correspondência eleitoral"}
              onMouseEnter={() =>
                setHover(
                  c
                    ? `${c.name} · ${fmt(c.votes)} votos`
                    : "Sem correspondência",
                )
              }
              onFocus={() =>
                setHover(
                  c
                    ? `${c.name} · ${fmt(c.votes)} votos`
                    : "Sem correspondência",
                )
              }
            >
              <path
                d={p.d}
                fill="#32647c"
                fillOpacity={opacity}
                className="map-city"
              >
                <title>
                  {c
                    ? c.name + " · " + fmt(c.votes) + " votos"
                    : "Sem correspondência"}
                </title>
              </path>
            </a>
          );
        })}
      </svg>
      <div className="map-legend">
        <span>
          <i style={{ background: "#32647c" }} />
          {mode === "leaders"
            ? "Cidade líder (inclui empate)"
            : "Maior intensidade = maior valor"}
        </span>
        <small>Malha: IBGE</small>
      </div>
      {missing.length ? (
        <p className="panel-footnote">
          {missing.length} município(s) sem geometria reconciliada nesta malha.
          A tabela mantém toda a cobertura eleitoral.
        </p>
      ) : null}
    </div>
  );
}
