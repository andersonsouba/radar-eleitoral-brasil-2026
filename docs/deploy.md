# Publicação

Destino: https://hubnio.com.br/dashpolitico

Repositório privado: https://github.com/andersonsouba/radar-eleitoral-brasil-2026

## Procedimento

Pacote privado com código, Dockerfile, mapas e snapshot oficial. Build Linux na VPS, container exclusivo `nio-dashpolitico`, sem porta pública própria, na rede existente `easypanel`. Traefik encaminha somente `/dashpolitico` e seus descendentes e solicita TLS pelo resolver existente `letsencrypt`.

O deploy não altera DNS, outros containers, banco de dados, firewall ou configuração do EasyPanel. Para interromper apenas o dashboard: `docker compose -p radar-eleitoral -f compose.production.yml stop`. Preserve o pacote anterior para rollback.

Atualização de dados: execute o ETL local, valide e empacote novamente o snapshot completo antes de reconstruir o container. Não há agendamento automático configurado.

## Verificação

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

O site oferece acesso público aos dados eleitorais oficiais; o código e o pacote de implantação permanecem no repositório privado. A base é a coleta de 05/10/2026 às 06:25 (Brasília), com pendências oficiais sinalizadas. Não há atualização automática.

## Legibilidade publicada

Fontes efetivamente verificadas no navegador público: corpo 16 px e menu 14 px. Container `radar-eleitoral:20261005-legibilidade` saudável e build/deploy com exit 0. Fluxo público e captura desktop/mobile reexecutados após a troca da versão.
