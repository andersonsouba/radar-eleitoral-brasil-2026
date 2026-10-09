# Publicação

Destino: https://hubnio.com.br/dashpolitico

Repositório privado: https://github.com/andersonsouba/radar-eleitoral-brasil-2026

## Versão atual — consultas territoriais de 09/10/2026

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
