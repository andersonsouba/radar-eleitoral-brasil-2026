"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Radar,
  LayoutDashboard,
  Map,
  MapPin,
  Users,
  Landmark,
  Flag,
  Building2,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Clock3,
  Info,
} from "lucide-react";
import { useResource, fmt, pct } from "@/lib/data";
import type { Snapshot, Overview, State, Result } from "@/lib/types";
import {
  Badge,
  Panel,
  Empty,
  Loading,
  Title,
  Stat,
  Source,
  StateSelect,
  Person,
  CandidateTable,
  BrazilMap,
  CityPicker,
  SnapshotStamp,
} from "./ui";
import { CityPage, DeputiesPage, DeputyPage } from "./territory";
import {
  GovernorsPage,
  PresidentPage,
  PartiesPage,
  Methodology,
} from "./national";
const NAV = [
  ["/", "Visão Geral", LayoutDashboard],
  ["/estados", "Estados", Map],
  ["/municipios", "Municípios", MapPin],
  ["/deputados-estaduais", "Deputados Estaduais", Users],
  ["/deputados-federais", "Deputados Federais", Users],
  ["/senado", "Senado", Landmark],
  ["/governadores", "Governadores", Building2],
  ["/presidente", "Presidente", Flag],
  ["/partidos", "Partidos", Users],
  ["/metodologia", "Metodologia / Fonte", BookOpen],
] as const;
export default function Dashboard() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const snapshot = useResource<Snapshot>("/data/current.json");
  const overview = useResource<Overview>(
    snapshot.data ? snapshot.data.base + "/overview.json" : null,
  );
  const attempt = useResource<{ status: string; at: string }>(
    "/data/attempt.json",
  );
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] ?? "";
  const id = segments[1];
  const selected = NAV.find(([href]) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href),
  );
  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <aside className={"sidebar " + (menu ? "sidebar-open" : "")}>
        <Link className="brand" href="/" onClick={() => setMenu(false)}>
          <span className="brand-mark">
            <Radar size={25} />
          </span>
          <div>
            RADAR ELEITORAL
            <small>
              BRASIL <b>2026</b>
            </small>
          </div>
        </Link>
        <div className="sidebar-label">ANÁLISE ELEITORAL</div>
        <nav aria-label="Navegação principal">
          {NAV.map(([href, label, Icon], i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenu(false)}
              className={
                (selected?.[0] === href ? "active " : "") +
                (i >= 1 && i <= 4 ? "priority" : "")
              }
              aria-current={selected?.[0] === href ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {selected?.[0] === href ? <ChevronRight size={14} /> : null}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={20} />
          <div>
            Dados públicos oficiais<small>Justiça Eleitoral / TSE</small>
          </div>
        </div>
        <div className="sidebar-foot">Painel independente · 1º turno</div>
      </aside>
      {menu ? (
        <button
          className="scrim"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      ) : null}
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <span className="breadcrumb">
              Brasil <ChevronRight size={13} />{" "}
              {selected?.[1] ?? "Detalhe territorial"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="round-tag">1º TURNO · 04 OUT 2026</span>
            <a
              href="https://resultados.tse.jus.br/oficial/app/index.html"
              target="_blank"
              rel="noreferrer"
            >
              Abrir TSE <ArrowUpRight size={14} />
            </a>
          </div>
        </header>
        <main id="conteudo" key={pathname}>
          {!snapshot.data || !overview.data ? (
            <Loading error={snapshot.error ?? overview.error} />
          ) : (
            <>
              {attempt.data?.status === "failed" ? (
                <div className="notice warning">
                  <Info size={18} />A última atualização falhou. Você está
                  consultando o último cache validado.
                </div>
              ) : null}
              <Route
                section={section}
                id={id}
                territoryView={segments[2]}
                snapshot={snapshot.data}
                overview={overview.data}
              />
            </>
          )}
        </main>
        <footer>
          Fonte: Tribunal Superior Eleitoral (TSE). Painel independente para
          análise de dados públicos eleitorais. Resultados e situações
          eleitorais devem ser conferidos com a publicação oficial da Justiça
          Eleitoral.
        </footer>
      </div>
    </div>
  );
}
function Route({
  section,
  id,
  territoryView,
  snapshot,
  overview,
}: {
  section: string;
  id?: string;
  territoryView?: string;
  snapshot: Snapshot;
  overview: Overview;
}) {
  switch (section) {
    case "":
      return <Home snapshot={snapshot} overview={overview} />;
    case "estados":
      return <StatesPage snapshot={snapshot} overview={overview} uf={id} />;
    case "municipios":
      return id?.includes("-") ? (
        <CityPage snapshot={snapshot} id={id} />
      ) : (
        <>
          <Title
            eyebrow="ANÁLISE MUNICIPAL"
            title="A força dos eleitos, cidade a cidade"
            description="Somente o líder estadual ou distrital e o líder federal entre os oficialmente eleitos."
          />
          <CityPicker
            snapshot={snapshot}
            states={overview.states}
            initialUF={id}
          />
          <div className="notice">
            <ShieldCheck size={20} />
            <span>
              Ser o mais votado em uma cidade não significa ter sido eleito.
              Aqui, a situação oficial vem primeiro.
            </span>
          </div>
        </>
      );
    case "deputados-estaduais":
      return (
        <DeputiesPage
          snapshot={snapshot}
          overview={overview}
          offices={[7, 8]}
          cities={id === "cidades"} cityId={territoryView}
        />
      );
    case "deputados-federais":
      return (
        <DeputiesPage snapshot={snapshot} overview={overview} offices={[6]} cities={id === "cidades"} cityId={territoryView} />
      );
    case "deputados":
      return <DeputyPage snapshot={snapshot} id={id ?? ""} view={territoryView === "liderancas" ? "leaders" : "votes"} />;
    case "senado":
      return (
        <DeputiesPage snapshot={snapshot} overview={overview} offices={[5]} />
      );
    case "governadores":
      return <GovernorsPage overview={overview} />;
    case "presidente":
      return <PresidentPage overview={overview} snapshot={snapshot} />;
    case "partidos":
      return <PartiesPage snapshot={snapshot} overview={overview} />;
    case "metodologia":
      return <Methodology snapshot={snapshot} overview={overview} />;
    default:
      return (
        <Empty title="Página não encontrada">
          <Link href="/">Voltar à visão geral</Link>
        </Empty>
      );
  }
}
function Home({
  snapshot,
  overview: o,
}: {
  snapshot: Snapshot;
  overview: Overview;
}) {
  const router = useRouter();
  const [uf, setUF] = useState("");
  const topParties = o.partySummary
    .filter((p) => p.office === 6)
    .sort((a, b) => b.elected - a.elected)
    .slice(0, 5);
  return (
    <>
      <Title
        eyebrow="PAINEL EXECUTIVO · PRIMEIRO TURNO"
        title="ELEIÇÕES 2026 — RADAR ELEITORAL BRASIL"
        description="Resultados oficiais da Justiça Eleitoral · 1º turno"
        action={<SnapshotStamp snapshot={snapshot} />}
      />
      <div className="stats-grid six">
        <Stat
          label="Seções totalizadas · Presidente"
          value={pct(o.president.meta.percent)}
          note={
            o.president.meta.final
              ? "Totalização final confirmada"
              : "Confirmação final pendente"
          }
          accent
        />
        <Stat
          label="Governadores eleitos"
          value={fmt(o.governorsElected)}
          note="Definidos no 1º turno"
        />
        <Stat
          label="UFs com 2º turno"
          value={fmt(o.governorsSecondRound)}
          note="Governador · situação oficial"
        />
        <Stat
          label="Estaduais / Distritais"
          value={fmt((o.counts["7"] ?? 0) + (o.counts["8"] ?? 0))}
          note="Eleitos confirmados pelo TSE"
        />
        <Stat
          label="Deputados Federais"
          value={fmt(o.counts["6"] ?? 0)}
          note="Eleitos confirmados pelo TSE"
        />
        <Stat
          label="Senadores eleitos"
          value={fmt(o.counts["5"] ?? 0)}
          note="Situação oficial confirmada"
        />
      </div>
      <div className="hero-grid">
        <Panel
          title="Explore o Brasil"
          description={`${fmt(o.municipalities)} municípios · 27 unidades federativas`}
          action={<span className="tiny-label">VISÃO TERRITORIAL</span>}
        >
          <BrazilMap states={o.states} />
          <div className="map-controls">
            <StateSelect states={o.states} value={uf} onChange={setUF} />
            <button
              className="button primary"
              disabled={!uf}
              onClick={() => router.push("/estados/" + uf)}
            >
              Analisar Estado <ArrowRight size={16} />
            </button>
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title="Presidência da República"
            description={
              o.president.meta.final
                ? "Situação oficial publicada"
                : "Aguardando confirmação final do TSE"
            }
            action={
              <Link
                className="icon-link"
                href="/presidente"
                aria-label="Abrir resultado presidencial"
              >
                <ArrowUpRight size={19} />
              </Link>
            }
          >
            <div className="president-list">
              {o.president.candidates.slice(0, 2).map((c) => (
                <div key={c.id}>
                  <Person c={c} />
                  <div className="candidate-bar">
                    <span style={{ width: (c.percent ?? 0) + "%" }} />
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
            <Source meta={o.president.meta} />
          </Panel>
          <Panel
            title="Do município ao deputado"
            description="Descubra quem lidera entre os eleitos em cada cidade."
            className="accent-panel"
          >
            <div className="big-icon">
              <MapPin size={30} />
            </div>
            <p>Uma cidade. Um líder eleito por cargo.</p>
            <Link href="/municipios" className="button primary">
              Analisar Município <ArrowRight size={16} />
            </Link>
          </Panel>
        </div>
      </div>
      <div className="lower-grid">
        <Panel
          title="Representação na Câmara Federal"
          description="Partidos com mais deputados oficialmente eleitos"
          action={
            <Link className="text-link" href="/partidos">
              Analisar partidos <ArrowRight size={14} />
            </Link>
          }
        >
          <div className="party-bars">
            {topParties.map((p) => (
              <div key={p.party}>
                <strong>{p.party}</strong>
                <div>
                  <span
                    style={{
                      width:
                        Math.max(
                          2,
                          (100 * p.elected) /
                            Math.max(1, topParties[0]?.elected),
                        ) + "%",
                    }}
                  />
                </div>
                <b>{p.elected}</b>
              </div>
            ))}
          </div>
          <p className="panel-footnote">
            Representação confirmada até a coleta. Cargos pendentes não são
            estimados.
          </p>
        </Panel>
        <Panel
          title="Leitura correta dos resultados"
          description="Votação e eleição são informações diferentes."
        >
          <div className="method-teaser">
            <ShieldCheck size={27} />
            <p>
              Os destaques municipais consideram{" "}
              <strong>somente candidatos oficialmente eleitos</strong> pela
              Justiça Eleitoral.
            </p>
          </div>
          <div className="notice compact">
            <Clock3 size={17} />
            {o.pending.length} combinações de UF e cargo legislativo ainda
            aguardam confirmação final.
          </div>
          <Link className="text-link" href="/metodologia">
            Entenda a metodologia <ArrowRight size={14} />
          </Link>
        </Panel>
      </div>
    </>
  );
}
function StatesPage({
  snapshot,
  overview,
  uf,
}: {
  snapshot: Snapshot;
  overview: Overview;
  uf?: string;
}) {
  const router = useRouter();
  const current = overview.states.find((s) => s.uf === uf);
  const { data, error } = useResource<State>(
    current ? snapshot.base + "/states/" + current.uf + ".json" : null,
  );
  if (!current)
    return (
      <>
        <Title
          eyebrow="ANÁLISE ESTADUAL"
          title="Estados"
          description="Escolha uma UF para explorar os deputados eleitos e sua presença territorial."
        />
        <Panel title="27 UFs, uma visão do território">
          <BrazilMap states={overview.states} />
          <div className="state-grid">
            {overview.states.map((s) => (
              <Link key={s.uf} href={"/estados/" + s.uf}>
                <b>{s.uf}</b>
                <span>
                  {s.name}
                  <small>{fmt(s.municipalities)} municípios</small>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </Panel>
      </>
    );
  if (!data) return <Loading error={error} />;
  const regional = uf === "DF" ? 8 : 7;
  return (
    <>
      <Title
        eyebrow={"BRASIL / " + data.uf}
        title={data.name}
        description={`${fmt(data.municipalities)} municípios · eleição proporcional · situação oficial do TSE`}
        action={
          <StateSelect
            states={overview.states}
            value={data.uf}
            onChange={(s) => router.push("/estados/" + s)}
            all={false}
          />
        }
      />
      <div className="notice">
        <MapPin size={20} />
        <span>
          Selecione um deputado eleito para descobrir onde ele recebeu votos e
          em quais cidades é líder entre os eleitos.
        </span>
        <Link href={"/municipios/" + data.uf}>
          Analisar municípios <ArrowRight size={14} />
        </Link>
      </div>
      <ElectedBlock result={data.results[String(regional)]} />
      <ElectedBlock result={data.results["6"]} />
      <div className="lower-grid">
        <Panel
          title="Governo do Estado"
          description="Resultado estadual e situação oficial"
        >
          <CandidateTable candidates={data.results["3"].candidates} limit={2} />
          <Source meta={data.results["3"].meta} />
        </Panel>
        <Panel
          title="Senado Federal"
          description={`${data.results["5"].seats} vagas informadas pelo TSE`}
        >
          <CandidateTable
            candidates={data.results["5"].candidates.filter((c) => c.elected)}
            limit={data.results["5"].seats}
          />
          <Source meta={data.results["5"].meta} />
        </Panel>
      </div>
      <AllCandidates
        result={data.results[String(regional)]}
        federal={data.results["6"]}
      />
    </>
  );
}
function ElectedBlock({ result }: { result: Result }) {
  const elected = result.candidates.filter((c) => c.elected);
  return (
    <Panel
      title={
        result.office === 8
          ? "Deputados Distritais eleitos"
          : result.office === 7
            ? "Deputados Estaduais eleitos"
            : "Deputados Federais eleitos"
      }
      description={`${fmt(elected.length)} eleitos confirmados · ${result.seats} vagas · ordenados por votos na UF`}
      action={
        <Badge
          status={result.meta.final ? "TOTALIZAÇÃO FINAL" : "EM TOTALIZAÇÃO"}
        />
      }
    >
      <CandidateTable candidates={elected} />
      <Source meta={result.meta} />
    </Panel>
  );
}
function AllCandidates({
  result,
  federal,
}: {
  result: Result;
  federal: Result;
}) {
  const [open, setOpen] = useState(false);
  const [cargo, setCargo] = useState(result.office);
  return (
    <Panel>
      <button
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Consulta secundária: todos os candidatos da UF{" "}
        <ChevronRight size={17} />
      </button>
      {open ? (
        <>
          <p className="notice compact">
            Inclui não eleitos e suplentes. Esta consulta não define os líderes
            municipais.
          </p>
          <div className="tabs">
            <button
              className={cargo === result.office ? "selected" : ""}
              onClick={() => setCargo(result.office)}
            >
              {result.name}
            </button>
            <button
              className={cargo === 6 ? "selected" : ""}
              onClick={() => setCargo(6)}
            >
              Deputado Federal
            </button>
          </div>
          <CandidateTable
            key={cargo}
            candidates={(cargo === 6 ? federal : result).candidates}
          />
        </>
      ) : null}
    </Panel>
  );
}
