# Publicação

Destino: https://hubnio.com.br/dashpolitico

Repositório privado: https://github.com/andersonsouba/radar-eleitoral-brasil-2026

## Versão atual — Executivo após segundo turno (26/10/2026)

Publicado às 12h29 (Brasília), com teste isolado aprovado e implantação exit 0. Conferência externa por HTTPS às 12h30: ponteiro, resumo, UF AC, município AC-01120 e catálogo de candidatos idênticos ao snapshot auditado; seis rotas com HTTP 200. Página inicial e filtro das seis UFs do segundo turno conferidos no Chrome público.

- Código implantado: `b8c159694fb136e9df40d37967ba3747ce6d250c`; PR #1.
- Release GitHub: `executivo-20261026`; pacote `radar-eleitoral-executivo-20261026.tar.gz`.
- SHA-256: `db8fe625fa7ad246a3feb0b35407eb8338bfbe34822998b06f372c22c7acdd19`.
- Imagem saudável: `radar-eleitoral:20261026-executivo`; serviço `nio-dashpolitico`.
- Diretório: `/opt/radar-eleitoral/releases/20261026-executivo`.
- Snapshot: `20261026T145857Z-executivo-c3048bd8`; coleta executiva de 26/10, encerrada às 12h03.
- Presidente: resultado oficial do segundo turno; governadores: 27 eleitos, seis UFs com disputa no segundo turno, nenhuma confirmação final pendente. Deputados e Senado preservados.
- Auditoria: 11.197 resultados oficiais, 5.571 municípios, 27 UFs; nenhuma divergência de soma; dados legislativos preservados.
- Rollback preservado: diretório `/opt/radar-eleitoral/releases/20261010-municipios`, imagem `radar-eleitoral:20261010-municipios`.
- Evidências: `evidencias/executivo-20261026-auditoria.json`, `evidencias/executivo-20261026-publicacao.json` e `evidencias/executivo-20261026-publicado.png`.

A implantação foi executada pelo terminal web da Hostinger aberto pelo usuário, sem alterar autenticação, permissões, DNS ou outros serviços. O script validou checksum, build, container isolado, rotas, snapshot e saúde antes de concluir a troca.

## Histórico — Municípios em cartões (10/10/2026)

A página `/municipios` abre com os primeiros 24 municípios em ordem alfabética, sem exigir uma busca inicial. Filtros por UF e nome, contador, paginação “Ver mais cidades” e links para as fichas municipais. O seletor compacto em Presidente permanece preservado.

- Código: `61767f5`, enviado à main privada após autorização do usuário.
- Release: `municipios-20261010`; imagem `radar-eleitoral:20261010-municipios` saudável.
- Diretório: `/opt/radar-eleitoral/releases/20261010-municipios`.
- SHA-256 do pacote: `26c144707e6f1ae8b4139ed4b86df6a9878e899efa2fde9f097a561d6b01eb0c`.
- Base eleitoral preservada: `20261005T152605Z-0f9c851a-cidades-7a9853d3`. Ponteiro e catálogo público em HTTPS conferidos byte a byte.
- Rollback: `/opt/radar-eleitoral/releases/20261009-cidades`, imagem `radar-eleitoral:20261009-cidades`.
- Validação pública: 5 testes de navegador passaram, sem falhas ou testes ignorados; cartões, filtros, paginação, fichas e navegação no subdiretório, com capturas desktop e mobile.
- Evidências: `evidencias/municipios-publicacao.json` e `evidencias/municipios-publicado.png`.

## Histórico — Deputados e Cidades (09/10/2026)

Publicado após autorização do usuário. **Deputados** reúne todas as cidades com votos e o filtro de lideranças; **Cidades** lista todos os candidatos votados no cargo, incluindo não eleitos, nas seções estaduais/distritais e federais.

- Código: `676d15f`, enviado à main do repositório privado.
- Release: `cidades-20261009`; imagem `radar-eleitoral:20261009-cidades` saudável, implantação exit 0.
- Diretório: `/opt/radar-eleitoral/releases/20261009-cidades`.
- Pacote SHA-256: `5e07021f7ad6325cb38b775857c12aade0c51107a985d5588a979b0537009291`.
- Base: `20261005T152605Z-0f9c851a-cidades-7a9853d3`, derivada da coleta de 05/10, sem atualização da totalização.
- Cobertura auditada: 5.571 cidades; 1.797.486 registros positivos candidato/cidade, incluindo 1.400.297 de não eleitos.
- HTTPS: ponteiro, resumo, duas consultas municipais e uma ficha de deputado idênticos aos arquivos locais auditados. Sete testes públicos aprovados, sem falhas ou ignorados, incluindo federal/estadual/distrital, liderança/empates, subdiretório e viewport móvel.
- Rollback preservado: `/opt/radar-eleitoral/releases/20261009-visoes`, imagem `radar-eleitoral:20261009-visoes`.
- Evidências: `evidencias/cidades-publicacao.json` e `evidencias/cidades-auditoria.json`.

## Histórico — consultas territoriais de 09/10/2026

Publicado e verificado no domínio: duas consultas para estaduais/distritais e federais, “Onde liderou” e “Onde recebeu votos”. Detalhes em `visoes-territoriais-20261009.md`.

- Código: `f8be17d`; release privada `visoes-20261009`.
- Imagem saudável: `radar-eleitoral:20261009-visoes`.
- Diretório: `/opt/radar-eleitoral/releases/20261009-visoes`.
- SHA-256: `5dde5bc7a0c8604e75574a26db744d28850d9a94e625e0f816ead0443c343a2a`.
- Mesma base `20261005T152605Z-0f9c851a`, coleta de 05/10 às 12h37. Não houve nova coleta.
- Lint, TypeScript e build PASS; regressão local 27 PASS/2 não aplicáveis; domínio público 6 PASS.
- Rollback preservado: `/opt/radar-eleitoral/releases/20261005-atualizacao` e imagem `radar-eleitoral:20261005-atualizacao`.
- Evidências: `evidencias/visoes-publicacao.json`, `evidencias/visoes-publico.json` e capturas `evidencias/visoes-desktop.png`/`evidencias/visoes-mobile.png`.

## Histórico — atualização de dados de 05/10/2026

Publicado em 05/10/2026 e verificado às 12h51 (Brasília). Snapshot `20261005T152605Z-0f9c851a`, coleta encerrada às 12h37: 513 federais, 1.035 estaduais e 24 distritais eleitos; nenhuma combinação UF/cargo legislativo pendente. Permanecem as limitações presidenciais descritas em `atualizacao-20261005.md`.

- Release privada: `atualizacao-20261005`, código `9a0c720`.
- Imagem saudável: `radar-eleitoral:20261005-atualizacao`; build/deploy exit 0.
- Diretório na VPS: `/opt/radar-eleitoral/releases/20261005-atualizacao`.
- SHA-256 do pacote: `17852610cad8b46ef1b0de2b0c6d49b13c035f11eca43c5ab3f10725ecb541a7`.
- Rollback preservado: release/diretório `20261005-legibilidade`, imagem `radar-eleitoral:20261005-legibilidade`.
- Seis testes públicos PASS. Ponteiro e resumo em HTTPS idênticos à base local auditada. Evidências: `evidencias/publicacao-atualizacao.json` e `evidencias/smoke-atualizacao-publico.json`.

## Procedimento

Pacote privado com código, Dockerfile, mapas e snapshot oficial. Build Linux na VPS, container exclusivo `nio-dashpolitico`, sem porta pública própria, na rede existente `easypanel`. Traefik encaminha somente `/dashpolitico` e seus descendentes e solicita TLS pelo resolver existente `letsencrypt`.

O deploy não altera DNS, outros containers, banco de dados, firewall ou configuração do EasyPanel. Para interromper apenas o dashboard: `docker compose -p radar-eleitoral -f compose.production.yml stop`. Preserve o pacote anterior para rollback.

Atualização de dados: execute o ETL local, valide e empacote novamente o snapshot completo antes de reconstruir o container. Não há agendamento automático configurado.

## Histórico — primeira publicação e legibilidade

Publicado e verificado em 05/10/2026. URL final: https://hubnio.com.br/dashpolitico

- Build Linux e implantação: exit 0.
- Container: `running healthy`.
- HTTPS: 200 na aplicação, rota estadual, rota municipal, ponteiro e mapa. Validação de certificado habilitada.
- Fluxo no domínio público: mapa Brasil → Acre → Bujari → deputado → cidade pelo mapa → recarregar, PASS, sem erro de JavaScript ou recurso HTTP com falha.
- Capturas públicas de desktop e viewport mobile: PASS; não equivalem a aparelho móvel físico.
- 27 UFs e 5.571 municípios no snapshot servido; 5.963.334 registros normalizados na base processada.
- Os containers anteriores permaneceram ativos, sem reinício. DNS, firewall e configuração global do proxy não foram alterados.
- Evidências: `evidencias/publicacao-http-tls.json`, `publicado-home.jpg` e `publicado-mobile.jpg`.

Código implantado após aumento das fontes: `7340503`. Pacote privado: release `legibilidade-20261005`.
Versão anterior preservada na VPS: `20261005` / imagem `radar-eleitoral:20261005`.
SHA-256: `f54630a8deaa29486b2baa942f02267221ca54c3dea0c0944f73191c08fca820`.

O site oferece acesso público aos dados eleitorais oficiais; o código e o pacote de implantação permanecem no repositório privado. A primeira base era a coleta de 05/10/2026 às 06:25 (Brasília), substituída pela versão atual acima. Não há atualização automática.

## Legibilidade publicada

Fontes efetivamente verificadas no navegador público: corpo 16 px e menu 14 px. Container `radar-eleitoral:20261005-legibilidade` saudável e build/deploy com exit 0. Fluxo público e captura desktop/mobile reexecutados após a troca da versão.
