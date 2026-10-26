"use client";
import { Check, ArrowUpRight } from "lucide-react";
import { useResource, fmt, date, officeName } from "@/lib/data";
import type { Snapshot, Overview, Validation } from "@/lib/types";
import { Panel, Title, Stat } from "./ui";
export function Methodology({
  snapshot,
  overview: o,
}: {
  snapshot: Snapshot;
  overview: Overview;
}) {
  const validation = useResource<Validation>(
    snapshot.base + "/validation.json",
  );
  return (
    <>
      <Title
        eyebrow="TRANSPARÊNCIA / FONTES E MÉTODO"
        title="Como ler este painel"
        description="Dados oficiais, critérios objetivos e limitações visíveis."
      />
      <div className="method-layout">
        <div>
          <Panel title="Turnos e atualização dos dados">
            <p>Presidente: resultado do {o.president.meta.round}º turno, na abrangência nacional, incluindo o exterior. Governadores: resultado do turno decisivo de cada UF. O turno e a data de cada resultado aparecem junto à fonte oficial.</p>
            <p>Deputados e Senado mantêm os resultados do primeiro turno e seus horários originais de coleta. A atualização do Executivo não altera as lideranças legislativas municipais. Na consulta de partidos para governador, os votos correspondem ao turno decisivo de cada UF; não são a soma dos dois turnos.</p>
          </Panel>
          <Panel title="Uma cidade, um líder eleito por cargo">
            <p>
              Os destaques municipais de deputados consideram apenas candidatos
              oficialmente classificados como eleitos pela Justiça Eleitoral.
              Por isso, o candidato com maior votação bruta em uma cidade pode
              não aparecer como líder se não tiver sido eleito.
            </p>
            <ol className="steps">
              <li>
                <b>Identificar os eleitos</b>
                <span>
                  Situação oficial: Eleito, Eleito por QP ou Eleito por média,
                  no resultado da UF.
                </span>
              </li>
              <li>
                <b>Cruzar com os votos municipais</b>
                <span>
                  Mesma eleição, turno, UF, cargo e sequencial de candidato.
                </span>
              </li>
              <li>
                <b>Selecionar somente o maior</b>
                <span>
                  Um líder por cargo. Em empate de votos positivos, todos os
                  empatados são identificados.
                </span>
              </li>
            </ol>
            <div className="example">
              <span>
                Eleito A<br />
                <b>5.000 votos</b>
              </span>
              <span>
                Não eleito B<br />
                <b>8.000 votos</b>
              </span>
              <span>
                Eleito C<br />
                <b>4.000 votos</b>
              </span>
              <strong>
                Líder: A <Check size={16} />
              </strong>
            </div>
          </Panel>
          <Panel title="Consultas por deputado e por cidade">
            <p><strong>Deputados:</strong> escolha um eleito para ver todas as cidades com votação nominal positiva. O filtro “Somente cidades onde liderou” restringe a consulta às lideranças entre eleitos do mesmo cargo, incluindo empates reais.</p>
            <p><strong>Cidades:</strong> escolha o município para consultar todos os candidatos votados no cargo, incluindo não eleitos. O ranking usa votos locais, preserva empates e exclui votação zero. A situação eleitoral é a oficial da UF. Os filtros não alteram a posição original.</p>
            <p>As duas visões estão nas entradas Deputados Estaduais (inclui Distritais) e Deputados Federais. Na ficha do deputado, ordene as cidades por votos absolutos ou percentual local. A coluna “Entre eleitos” informa sua posição entre eleitos na cidade. Na consulta Cidades, a posição considera todos os votados no cargo. O percentual local usa os votos válidos do cargo no município.</p>
          </Panel>
          <Panel title="Votação não é eleição">
            <p>
              No sistema proporcional, a eleição depende das regras de
              distribuição de vagas entre partidos e federações e da situação
              oficial. O painel não tenta recalcular nem prever esse resultado.
            </p>
            <p>
              O indicador genérico “e=s” também pode sinalizar segundo turno.
              Por isso, o campo de situação textual é obrigatório para afirmar
              que alguém foi eleito.
            </p>
            <p>
              <strong>100% das seções não significa totalização final.</strong>{" "}
              Percentual de seções, confirmação final e situação de cada
              candidato são exibidos separadamente.
            </p>
          </Panel>
          <Panel title="Percentuais e contagens">
            <ul className="method-list">
              <li>
                <strong>Líder municipal de deputado:</strong> votos computados
                do candidato divididos pelos votos válidos do cargo na cidade
                (nominais + legenda).
              </li>
              <li>
                <strong>Rankings estaduais e cargos majoritários:</strong>{" "}
                percentual oficial do TSE sobre votos a votáveis concorrentes.
                Pode diferir do denominador de votos válidos.
              </li>
              <li>
                <strong>Partidos:</strong> nominais válidos e legenda válida
                separados; total e participação restritos ao mesmo cargo e
                abrangência.
              </li>
              <li>
                <strong>Território partidário:</strong> cidades com líder
                exclusivo e cidades empatadas são contadas em colunas distintas.
                Um empate entre candidatos do mesmo partido conta uma cidade no
                partido.
              </li>
              <li>
                <strong>Concentração:</strong> soma das Top 5 ou Top 10 cidades
                dividida pelos votos do candidato na UF. Suspensa se os
                agregados não coincidirem.
              </li>
              <li>
                <strong>Presidência:</strong> o total nacional inclui o
                exterior. O catálogo municipal cobre as 27 UFs; não inclui
                localidades de votação no exterior.
              </li>
              <li>
                <strong>DF:</strong> Brasília é tratada como unidade eleitoral
                presente no cadastro do TSE, com Deputado Distrital.
              </li>
            </ul>
          </Panel>
          <Panel title="Validação e limitações">
            <div className="stats-grid three">
              <Stat label="UFs carregadas" value={fmt(snapshot.ufs)} />
              <Stat
                label="Municípios eleitorais"
                value={fmt(snapshot.municipalities)}
              />
              <Stat
                label="Registros municipais"
                value={fmt(snapshot.municipalRows)}
              />
            </div>
            <p>
              {o.validation.sampleStates} UFs e {o.validation.sampleCities}{" "}
              municípios conferidos contra os arquivos oficiais. As verificações
              incluem a filtragem de eleitos, empates, schema e cobertura.
            </p>
            <p>
              {o.validation.aggregationDivergences.length} grupos de UF/cargo
              apresentam divergência entre a soma municipal e o arquivo
              estadual. A coleta de arquivos é sequencial no tempo; as
              divergências ficam registradas.
            </p>
            <p>
              {o.pending.length} combinações de UF/cargo legislativo aguardam
              confirmação final. Resultados parciais permanecem identificados.
              Dados não disponíveis não são substituídos por estimativas.
            </p>
            <p>
              A malha geográfica simplificada do IBGE pode não conter municípios
              criados após sua referência. A pesquisa e as tabelas usam o
              cadastro eleitoral completo. Situação de candidatura e fotos não
              são inferidas do resultado.
            </p>
            {validation.data ? (
              <details>
                <summary>Ver amostras conferidas</summary>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Município</th>
                        <th>Cargo</th>
                        <th>Conferência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.data.samples?.map((s, i) => (
                        <tr key={i}>
                          <td>
                            {s.city} / {s.uf}
                          </td>
                          <td>{officeName(s.office)}</td>
                          <td>
                            <a href={s.url} target="_blank" rel="noreferrer">
                              {s.status} · arquivo TSE
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Fontes oficiais">
            <div className="source-links">
              <a
                href="https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados"
                target="_blank"
                rel="noreferrer"
              >
                Documentação técnica TSE 2026 <ArrowUpRight size={16} />
              </a>
              <a
                href="https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-760-de-2-de-marco-de-2026"
                target="_blank"
                rel="noreferrer"
              >
                Calendário oficial 2026 <ArrowUpRight size={16} />
              </a>
              <a
                href="https://resultados.tse.jus.br/oficial/comum/config/ele-c.json"
                target="_blank"
                rel="noreferrer"
              >
                Configuração oficial das eleições <ArrowUpRight size={16} />
              </a>
              <a
                href="https://dadosabertos.tse.jus.br/"
                target="_blank"
                rel="noreferrer"
              >
                Portal de Dados Abertos <ArrowUpRight size={16} />
              </a>
              <a
                href="https://servicodados.ibge.gov.br/api/docs/malhas"
                target="_blank"
                rel="noreferrer"
              >
                Malhas territoriais IBGE <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="panel-footnote">
              Resultados: arquivos EA20 de produção. Cadastro: EA12. Descoberta
              de eleições: EA11. Dados Abertos é referência complementar; seus
              números não foram necessários nesta carga.
            </p>
          </Panel>
          <Panel title="Esta coleta">
            <dl className="metadata-list">
              <dt>Início</dt>
              <dd>{date(o.collectionStart)}</dd>
              <dt>Último arquivo</dt>
              <dd>{date(o.collectionEnd)}</dd>
              <dt>Fuso exibido</dt>
              <dd>Brasília (America/Sao_Paulo)</dd>
              <dt>Ambiente</dt>
              <dd>Oficial · produção</dd>
              <dt>Atualização</dt>
              <dd>Snapshot local; sem atualização automática</dd>
              <dt>Integridade</dt>
              <dd>
                SHA-256 dos arquivos coletados por HTTPS. Assinaturas JWS não
                verificadas.
              </dd>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
