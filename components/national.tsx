"use client";
import Link from "next/link";
import { useState } from "react";
import { Clock3, ArrowUpRight } from "lucide-react";
import { useResource, fmt, pct, officeName, fold } from "@/lib/data";
import type { Snapshot, Overview, Party, PartyTerritory } from "@/lib/types";
import {
  Badge,
  Panel,
  Empty,
  Loading,
  Title,
  Stat,
  Source,
  Progress,
  StateSelect,
  SearchField,
  Person,
  CandidateTable,
  BrazilMap,
  CityPicker,
  SnapshotStamp,
} from "./ui";
import calendar from "@/config/eleicao-2026.json";
export { Methodology } from "./methodology";
export function GovernorsPage({ overview: o }: { overview: Overview }) {
  const [filter, setFilter] = useState("all");
  const states = o.states.filter(
    (s) =>
      filter === "all" ||
      (filter === "elected"
        ? s.offices["3"].elected > 0 && s.offices["3"].meta.round === 1
        : s.offices["3"].meta.round === 2 || s.offices["3"].secondRound > 0),
  );
  return (
    <>
      <Title
        eyebrow="PODER EXECUTIVO / ESTADOS"
        title="Governadores"
        description="Resultados do turno decisivo em cada UF, conforme a situação oficial da Justiça Eleitoral."
      />
      <div className="lower-grid">
        <Panel title="Situação nas UFs">
          <BrazilMap states={o.states} mode="governors" />
        </Panel>
        <Panel title="Situação dos governadores">
          <div className="stats-grid two">
            <Stat
              label="Governadores eleitos"
              value={fmt(o.governorsElected)}
            />
            <Stat
              label={o.president.meta.round === 2 ? "UFs que disputaram 2º turno" : "UFs com 2º turno"}
              value={fmt(o.governorsSecondRound)}
            />
          </div>
          <div className="notice">
            <Clock3 size={20} />
            <span>
              Data do 2º turno:{" "}
              {o.settings.secondRoundDate ?? calendar.secondRoundDate}.
              {o.governorsPending != null ? ` ${o.governorsPending} UFs aguardam confirmação final.` : ""}
            </span>
          </div>
          <p className="panel-footnote">
            A confirmação segue o campo de situação oficial. Votação parcial e
            definição matemática não são apresentadas como resultado final.
          </p>
        </Panel>
      </div>
      <Panel title="Resultado por estado">
        <div className="tabs">
          {[
            ["all", "Todos"],
            ["elected", "Eleito no 1º turno"],
            ["round", "2º turno"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={filter === v ? "selected" : ""}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="governor-grid">
          {states.map((s) => (
            <div className="governor-card" key={s.uf}>
              <Link href={"/estados/" + s.uf}>
                <span>{s.uf}</span>
                <h3>{s.name}</h3>
                <ArrowUpRight size={17} />
              </Link>
              <p className="panel-footnote">Resultado do {s.offices["3"].meta.round}º turno</p>
              {s.offices["3"].highlights.length ? (
                s.offices["3"].highlights.map((c) => (
                  <div key={c.id}>
                    <Person c={c} />
                    <Badge status={c.status} />
                  </div>
                ))
              ) : (
                <Empty title="Em totalização" />
              )}
              <Progress meta={s.offices["3"].meta} />
              <Source meta={s.offices["3"].meta} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
export function PresidentPage({
  overview: o,
  snapshot,
}: {
  overview: Overview;
  snapshot: Snapshot;
}) {
  const r = o.president;
  return (
    <>
      <Title
        eyebrow="PODER EXECUTIVO / BRASIL"
        title="Presidente da República"
        description={`Resultado nacional do ${r.meta.round}º turno, incluindo o exterior. A situação oficial é independente da liderança em votos.`}
        action={<SnapshotStamp snapshot={snapshot} />}
      />
      <div className="lower-grid">
        <Panel
          title="Situação nacional"
          description={
            r.meta.final
              ? "Totalização final confirmada"
              : "Confirmação final pendente"
          }
        >
          <Progress meta={r.meta} />
          {r.candidates.slice(0, 2).map((c) => (
            <div className="president-highlight" key={c.id}>
              <Person c={c} />
              <Badge status={c.status} />
            </div>
          ))}
          <div className="notice compact">
            <Clock3 size={18} />
            2º turno: {o.settings.secondRoundDate ??
              calendar.secondRoundDate}.{" "}
            {r.meta.round === 2
              ? "Resultado do segundo turno. Situação conforme a totalização oficial."
              : r.candidates.some((c) => c.secondRound)
              ? "Classificados identificados pela situação oficial."
              : "Classificados ainda não confirmados neste snapshot."}
          </div>
          <Source meta={r.meta} />
        </Panel>
        <Panel
          title="Resultados por UF"
          description="Cor indica o candidato mais votado localmente; não indica eleição."
        >
          <BrazilMap states={o.states} mode="president" />
        </Panel>
      </div>
      <Panel
        title="Votação nacional"
        description="Percentuais oficiais do TSE sobre votos a votáveis concorrentes."
      >
        <CandidateTable candidates={r.candidates} />
      </Panel>
      <Panel
        title="Liderança presidencial por UF"
        description="Mais votado localmente. Isso não representa eleição para o cargo."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>UF</th>
                <th>Mais votado</th>
                <th>Partido</th>
                <th className="numeric">Votos</th>
                <th className="numeric">%</th>
              </tr>
            </thead>
            <tbody>
              {o.states.map((s) => {
                const leaders = s.offices["1"].voteLeaders ?? [];
                return (
                  <tr key={s.uf}>
                    <td>
                      <Link href={"/estados/" + s.uf}>{s.uf}</Link>
                    </td>
                    <td>
                      {leaders[0]?.name ?? "Indisponível"}
                      {leaders.length > 1 &&
                      leaders[0]?.votes === leaders[1]?.votes
                        ? " · Empate"
                        : ""}
                    </td>
                    <td>{leaders[0]?.party ?? "—"}</td>
                    <td className="numeric">{fmt(leaders[0]?.votes)}</td>
                    <td className="numeric">{pct(leaders[0]?.percent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <CityPicker snapshot={snapshot} states={o.states} />
    </>
  );
}
export function PartiesPage({
  snapshot,
  overview,
}: {
  snapshot: Snapshot;
  overview: Overview;
}) {
  const { data, error } = useResource<{ national: Party[]; states: Party[] }>(
    snapshot.base + "/parties.json",
  );
  const [office, setOffice] = useState(6);
  const [uf, setUF] = useState("");
  const [selected, setSelected] = useState("");
  const detail = useResource<PartyTerritory[]>(
    selected
      ? snapshot.base + "/parties/" + encodeURIComponent(selected) + ".json"
      : null,
  );
  const [cityQuery, setCityQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const rows =
    (uf ? data?.states : data?.national)
      ?.filter((p) => p.office === office && (!uf || p.uf === uf))
      .sort((a, b) => b.elected - a.elected || b.total - a.total) ?? [];
  const territories = (detail.data ?? [])
    .filter(
      (t) =>
        t.office === office &&
        (!uf || t.uf === uf) &&
        fold(t.municipality).includes(fold(cityQuery)),
    )
    .sort((a, b) => b.votes - a.votes);
  return (
    <>
      <Title
        eyebrow="PARTIDOS / REPRESENTAÇÃO E TERRITÓRIO"
        title="A presença dos partidos"
        description="Representação, votação e liderança municipal são métricas distintas, sempre separadas por cargo."
      />
      <Panel>
        <div className="filters">
          <label className="field">
            <span>Cargo</span>
            <select
              value={office}
              onChange={(e) => {
                setOffice(Number(e.target.value));
                setSelected("");
              }}
            >
              {[7, 8, 6, 5, 3, 1].map((o) => (
                <option value={o} key={o}>
                  {officeName(o)}
                </option>
              ))}
            </select>
          </label>
          <StateSelect states={overview.states} value={uf} onChange={setUF} />
        </div>
        {!data ? (
          <Loading error={error} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Partido</th>
                  <th className="numeric">Eleitos</th>
                  <th className="numeric">2º turno</th>
                  <th className="numeric">Nominais válidos</th>
                  <th className="numeric">Legenda válida</th>
                  <th className="numeric">Total do cargo</th>
                  <th className="numeric">Participação</th>
                  {[6, 7, 8].includes(office) ? (
                    <>
                      <th className="numeric">Municípios líderes</th>
                      <th className="numeric">Empates</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.party}>
                    <td>
                      {[6, 7, 8].includes(office) ? (
                        <button
                          className="party-button"
                          onClick={() => {
                            setSelected(p.party);
                            setLimit(10);
                          }}
                        >
                          {p.party}
                          <ArrowUpRight size={13} />
                        </button>
                      ) : (
                        <strong>{p.party}</strong>
                      )}
                    </td>
                    <td className="numeric">{fmt(p.elected)}</td>
                    <td className="numeric">{fmt(p.secondRound)}</td>
                    <td className="numeric">{fmt(p.nominal)}</td>
                    <td className="numeric">{fmt(p.legend)}</td>
                    <td className="numeric">{fmt(p.total)}</td>
                    <td className="numeric">{pct(p.percent)}</td>
                    {[6, 7, 8].includes(office) ? (
                      <>
                        <td className="numeric">{fmt(p.municipalities)}</td>
                        <td className="numeric">{fmt(p.ties)}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="panel-footnote">
          Municípios líderes contam vitórias exclusivas. Empates são informados
          à parte, sem duplicar a mesma cidade dentro de um partido. Não há soma
          de votos entre cargos.
        </p>
      </Panel>
      {selected ? (
        <Panel
          title={`${selected} · cidades lideradas`}
          description={officeName(office) + " · entre os oficialmente eleitos"}
        >
          <SearchField
            value={cityQuery}
            onChange={setCityQuery}
            label="Pesquisar cidade"
            placeholder="Nome da cidade…"
          />
          {detail.loading ? (
            <Loading />
          ) : territories.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Município</th>
                      <th>UF</th>
                      <th>Deputado líder</th>
                      <th className="numeric">Votos</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {territories.slice(0, limit).map((t) => (
                      <tr key={t.cityId + t.candidateId}>
                        <td>
                          <Link href={"/municipios/" + t.cityId}>
                            {t.municipality}
                          </Link>
                        </td>
                        <td>{t.uf}</td>
                        <td>
                          <Link href={"/deputados/" + t.candidateId}>
                            {t.candidate}
                          </Link>
                        </td>
                        <td className="numeric">{fmt(t.votes)}</td>
                        <td>{t.tie ? "Empate" : "Liderança exclusiva"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {limit < territories.length ? (
                <button
                  className="show-more"
                  onClick={() => setLimit((v) => v + 50)}
                >
                  Ver mais cidades
                </button>
              ) : null}
            </>
          ) : (
            <Empty title="Sem cidades líderes nesta seleção" />
          )}
        </Panel>
      ) : null}
    </>
  );
}
