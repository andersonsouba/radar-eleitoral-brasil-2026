# Fontes, campos e coleta

Data-base solicitada: 05/10/2026. Todos os resultados usados vieram do ambiente **oficial** de produção e foram validados com `f=o`. Não foram utilizados resultados de notícias, agregadores, outras eleições ou simulados.

## Fontes primárias

| Fonte | Endereço | Finalidade |
|---|---|---|
| Documentação TSE 2026 | https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados | Ambiente, limites, cargos, especificações EA11/EA12/EA20 |
| EA11 | https://resultados.tse.jus.br/oficial/comum/config/ele-c.json | Descoberta de pleito, ciclo, eleição, turno e cargos |
| EA12 | https://resultados.tse.jus.br/oficial/ele2026/6259/config/mun-e006259-cm.json | Cadastro dos municípios, UF, código TSE, código IBGE e capital |
| EA20 nacional | https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json | Presidência nacional, incluindo exterior |
| EA20 estadual | https://resultados.tse.jus.br/oficial/ele2026/6259/dados/ac/ac-c0006-e006259-u.json | Exemplo federal/AC; fonte da situação oficial de eleição |
| EA20 municipal | https://resultados.tse.jus.br/oficial/ele2026/6259/dados/ac/ac01120-c0006-e006259-u.json | Exemplo Acrelândia/AC; votação local |
| EA20 — especificação | https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/divulgacao-de-resultados/tse-ea20-arquivo-de-resultado-unificado | Dicionário de campos, hierarquia e conceitos dos votos |
| Calendário | https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-760-de-2-de-marco-de-2026 | 1º turno em 04/10/2026 e eventual 2º turno em 25/10/2026 |
| IBGE | https://servicodados.ibge.gov.br/api/docs/malhas | Geometria simplificada; não fornece resultados eleitorais |
| Dados Abertos TSE | https://dadosabertos.tse.jus.br/ | Referência complementar. A tentativa CKAN `package_show?id=resultados-2026` retornou 404; não usada para números |

A descoberta confirmou pleito 3220, eleição 6257 (Presidente) e 6259 (Governador, Senador, Federal, Estadual/Distrital). Deputado Federal pertence à eleição estadual na configuração oficial, não à eleição federal da Presidência.

Os nomes de arquivos municipais usam cinco dígitos no código municipal e seis na eleição. Todos os URLs exatos, hashes e horários por arquivo constam de `data/processed/<versao>/manifest.json` e dos metadados adjacentes aos arquivos raw. São 27.993 arquivos oficiais nesta coleta: configuração, cadastro, nacional e 27.990 estaduais/municipais.

## Mapeamento

| Campo TSE | Uso |
|---|---|
| `f`, `ele`, `t`, `tpabr`, `cdabr`, `carg.cd` | Rejeita ambiente, eleição, turno, cargo ou abrangência errados |
| `abr[].cd`, `abr[].mu[].cd/cdi/nm` | UF, município eleitoral, código IBGE e nome |
| `carg.agr.par.cand.sqcand` | Identificador de cruzamento UF × município |
| `n`, `nm`, `nmu` | Número, nome completo e nome de urna |
| `par.sg/nm/nfed`, `agr.nm` | Partido, nome, federação e agrupamento/coligação |
| `cand.st` | Situação da totalização; apenas os três textos de eleito entram no destaque |
| `cand.e` | Indicador auxiliar; sozinho não prova eleição, pois também vale para segundo turno |
| `cand.vap` | Votos computados do candidato |
| `cand.pvapn` | Percentual oficial sobre votos a votáveis concorrentes, 9 casas |
| `cand.dvt` | Destinação dos votos; não é situação de candidatura |
| `par.tvtn/tvtl` | Votos válidos nominais e válidos de legenda |
| `v.vv/vnom/vl/vvc` | Válidos, nominais, legenda e votos a votáveis concorrentes |
| `carg.nv` | Vagas oficiais, inclusive Senado; não inferidas de eleição anterior |
| `s.ts/st/pstn` | Seções totais, totalizadas e percentual |
| `e.c/a/pcn/pan` | Comparecimento, abstenção e respectivos percentuais |
| `tf`, `and`, `md`, `esae`, `mnae` | Totalização final, andamento, definição matemática e ausência de atribuição |
| `dt/ht`, `dg/hg`, `idg` | Totalização, geração e identificador do arquivo |

Percentual municipal dos líderes = `vap / v.vv × 100`. Percentuais estaduais/majoritários preservam `pvapn`; os denominadores podem diferir. Fatos municipais conservam ambas as porcentagens e a destinação dos votos. Não se somam votos de cargos diferentes.

O resultado de deputado vem do EA20 estadual, que cobre Estadual/Distrital; EA10 não cobre todos os cargos do escopo. Segundo turno e eleição presidencial usam a situação nacional. O mapa eleitoral inclui DF e a unidade eleitoral Brasília conforme EA12, sem afirmar que DF é município.

## Evidência desta carga

Coleta dos arquivos usados: **05/10/2026, 06:13:40 a 06:25:35, Brasília** (09:13:40–09:25:35 UTC). O identificador completo do snapshot está em `public/data/current.json` e no relatório de validação.

Presidência: 100% das seções no arquivo coletado, mas `tf=n`, `and=p`, situações dos candidatos ainda vazias. Nenhum candidato foi apresentado como Presidente eleito ou classificado ao segundo turno por inferência. A data de 25/10/2026 vem do calendário oficial documental, porque EA11 ainda não trazia o pleito de segundo turno nessa coleta.

Seis grupos legislativos estavam sem confirmação final: BA/Estadual, MG/Federal e Estadual, PR/Estadual, SP/Federal e Estadual. Isso não impede a apresentação dos dados locais existentes, mas impede nomear um líder eleito desses cargos.

O transporte HTTPS foi validado pelo runtime Python; não foi desabilitada a verificação TLS. SHA-256 detecta alteração posterior do arquivo local, mas **não substitui a validação de assinatura JWS**, que não foi implementada.

## Geometria

Nacional: `https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima`.

Por UF: `https://servicodados.ibge.gov.br/api/v3/malhas/estados/<codigo>?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`.

Mapas incluem fonte, SHA-256 e UTC de coleta. A malha disponível tem 141 municípios em MT, enquanto EA12 tem 142. A cidade sem geometria reconciliada permanece na busca e na tabela; nenhuma forma geográfica foi inventada. Não foi necessário usar imagem gerada.
