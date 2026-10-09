"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { fold, fmt, officeName, useResource } from "@/lib/data";
import type { Municipality, MunicipalVotes, Overview, Snapshot } from "@/lib/types";
import { CandidateTable, Empty, Loading, Panel, SearchField, Source, StateSelect, Title } from "./ui";
import { TerritoryViews } from "./territory-views";

export function CityVotesBrowser({ snapshot, overview, offices, baseHref, cityId }: {
  snapshot: Snapshot; overview: Overview; offices: number[]; baseHref: string; cityId?: string;
}) {
  const { data: cities, error } = useResource<Municipality[]>(snapshot.base + "/municipalities.json");
  const [uf, setUF] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(24);
  const selected = cities?.find(c => c.id === cityId);
  const filtered = (cities ?? []).filter(c => (!uf || c.uf === uf) && fold(c.name).includes(fold(query)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.uf.localeCompare(b.uf));
  const office = offices[0] === 6 ? 6 : selected?.uf === "DF" ? 8 : 7;
  return <>
    <Title eyebrow={offices[0] === 6 ? "DEPUTADOS FEDERAIS / CIDADES" : "DEPUTADOS ESTADUAIS E DISTRITAIS / CIDADES"}
      title={selected ? `${selected.name} / ${selected.uf}` : "Votação por cidade"}
      description={selected ? `${officeName(office)} · Todos os candidatos com pelo menos um voto nesta cidade.` : "Escolha o estado e a cidade para consultar os candidatos votados, eleitos e não eleitos."}
      action={cityId ? <Link className="button secondary" href={baseHref + "/cidades"}><ArrowLeft size={16} /> Trocar cidade</Link> : undefined} />
    <TerritoryViews baseHref={baseHref} cities />
    {cityId ? !cities ? <Loading error={error} /> : !selected ? <Empty title="Cidade não encontrada" /> :
      <CityVoteResults key={cityId + office} snapshot={snapshot} cityId={cityId} office={office} /> :
      <Panel>
        <div className="filters">
          <StateSelect states={overview.states} value={uf} onChange={v => {setUF(v); setVisible(24);}} />
          <SearchField label="Pesquisar município" placeholder="Digite o nome da cidade…" value={query} onChange={v => {setQuery(v); setVisible(24);}} />
        </div>
        {!cities ? <Loading error={error} /> : <>
          <div className="result-count" role="status">{fmt(filtered.length)} cidades nesta seleção</div>
          {filtered.length ? <div className="city-options">{filtered.slice(0, visible).map(c =>
            <Link key={c.id} href={baseHref + "/cidades/" + c.id} aria-label={`${c.name} / ${c.uf}`}>
              <span><strong>{c.name}</strong><small>{c.uf}{c.capital ? " · Capital" : ""}</small></span><ArrowUpRight size={17} />
            </Link>)}</div> : <Empty title="Nenhuma cidade nesta seleção" />}
          {visible < filtered.length ? <button className="show-more" onClick={() => setVisible(v => v + 48)}>Ver mais cidades</button> : null}
        </>}
      </Panel>}
  </>;
}

function CityVoteResults({ snapshot, cityId, office }: { snapshot: Snapshot; cityId: string; office: number }) {
  const {data, error} = useResource<MunicipalVotes>(snapshot.municipalVotes ? snapshot.base + "/municipal-votes/" + encodeURIComponent(cityId) + ".json" : null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  if (!snapshot.municipalVotes) return <Empty title="Votação por cidade ainda indisponível">Esta versão da base ainda não contém a consulta completa por cidade.</Empty>;
  if (!data) return <Loading error={error} />;
  const result = data.results[String(office)];
  if (!result) return <Empty title="Cargo não disponível nesta cidade" />;
  const rows = result.candidates.filter(c => fold(c.name + " " + c.party + " " + c.number).includes(fold(query)) &&
    (status === "all" || (status === "elected" ? c.elected : !c.elected)));
  return <Panel title={officeName(office) + " · votação na cidade"} className="city-votes"
    description="Ranking por votos locais. Empates mantêm a mesma posição; os filtros preservam a posição original.">
    <div className="filters">
      <SearchField label="Candidato ou partido" placeholder="Nome, número ou sigla…" value={query} onChange={setQuery} />
      <label className="field"><span>Situação eleitoral</span><select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="all">Todos os votados</option><option value="elected">Eleitos</option><option value="others">Não eleitos e demais situações</option>
      </select></label>
    </div>
    <div className="result-count" role="status">{fmt(rows.length)} candidatos nesta seleção · {fmt(result.candidates.length)} votados na cidade</div>
    <p className="territory-explanation">% local: participação nos votos válidos do cargo na cidade. A situação eleitoral vem do resultado oficial da UF; a posição local não determina a eleição.</p>
    <p className="table-scroll-hint">Deslize a tabela para ver votos, percentual e situação →</p>
    {rows.length ? <CandidateTable key={query + status} candidates={rows} local preserveRank detailSuffix="/votos" /> : <Empty title="Nenhum candidato nesta seleção" />}
    <Source meta={result.meta} />
    <a className="small-link" href={result.officialMeta.url} target="_blank" rel="noreferrer">Situação oficial de eleição: arquivo da UF</a>
  </Panel>;
}
