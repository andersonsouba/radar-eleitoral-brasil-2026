# Atualização da base eleitoral — 05/10/2026

Snapshot: `20261005T152605Z-0f9c851a`.
Coleta completa: 12h26min05s–12h37min53s, Brasília. Processamento concluído às 12h41.

## Delta

| Indicador | Primeira coleta | Nova coleta |
|---|---:|---:|
| Federais eleitos | 390 | 513 |
| Estaduais eleitos | 747 | 1.035 |
| Distritais eleitos | 24 | 24 |
| Combinações UF/cargo legislativo pendentes | 6 | 0 |
| Destaques municipais com pendência | 3.812 | 0 |
| Destaques com líder único | 7.326 | 11.134 |
| Destaques com empate real | 4 | 8 |
| Grupos com divergência de soma municipal | 2 | 1 |

As seis confirmações são BA/Estadual (63), MG/Federal (53), MG/Estadual (77), PR/Estadual (54), SP/Federal (70) e SP/Estadual (94). Rankings estaduais, territórios dos deputados, líderes municipais e contagens partidárias foram recalculados a partir da coleta completa.

Permanecem 27 UFs, 5.571 municípios, 18.852 candidatos e 5.963.334 registros candidato × município × cargo. Senadores: 54 eleitos; governadores: 20 eleitos e 7 UFs em segundo turno.

## Validação

- Coleta: 27.993 arquivos oficiais, incluindo configuração, cadastro e resultado nacional; validação de ambiente, eleição, turno, cargo e abrangência.
- Auditoria independente: 11.142 combinações município/cargo PASS, lendo novamente os arquivos brutos. Evidência: `independent-audit.json`.
- Em 2.303 combinações, um não eleito recebeu mais votos locais; nenhum deles foi promovido a líder.
- Amostragem do ETL: 13 cidades em 5 UFs. Cadastro completo validado contra EA12.
- Lint e TypeScript: PASS. Regras eleitorais, layout e fontes ampliadas preservados.
- Navegador local: 5 testes PASS (quatro capitais antes pendentes e navegação por mapas). Captura exclusiva de HTTPS ignorada localmente e reservada à verificação pública.
- Publicação: PASS. Build/deploy Linux com exit 0 e container saudável. Seis testes no domínio público passaram, incluindo BA/MG/PR/SP, navegação por mapas e capturas desktop/mobile. Fontes de 16 px no corpo e 14 px no menu preservadas.

Uma tentativa de testes locais encontrou o servidor local desligado e uma restrição no diretório temporário do navegador. O servidor foi iniciado e o cache de testes foi direcionado ao diretório de trabalho. Não houve alteração da aplicação para contornar essas falhas do ambiente de teste.

## Limites mantidos

A Presidência continua sem confirmação final no arquivo nacional (`tf=n`). Permanece divergência presidencial entre soma municipal e UF na BA, em 7 candidatos. A divergência anterior em MG desapareceu. Os números oficiais são preservados, sem ajuste artificial. Não existem divergências de agregação de deputados ou senadores.

Continuam as limitações já documentadas para a geometria de Boa Esperança do Norte/MT, fotos/situação de candidatura e validação de assinaturas JWS. A atualização segue manual.

## Publicação

Pacote: `radar-eleitoral-atualizacao-20261005.tar.gz`, contendo somente o snapshot atual, mapas e código necessário para o container.
SHA-256: `17852610cad8b46ef1b0de2b0c6d49b13c035f11eca43c5ab3f10725ecb541a7`.
Imagem: `radar-eleitoral:20261005-atualizacao`.
Destino: https://hubnio.com.br/dashpolitico
Versão anterior preservada para rollback: `20261005-legibilidade`.

Publicado e verificado em 05/10/2026 às 12h51 (Brasília). Ponteiro e resumo públicos correspondem byte a byte aos arquivos locais auditados, com HTTPS e validação de certificado habilitada. Evidências: `evidencias/publicacao-atualizacao.json`, `evidencias/smoke-atualizacao-publico.json`, `evidencias/publicado-home.jpg` e `evidencias/publicado-mobile.jpg`. Captura mobile usa viewport de navegador, sem alegação de teste em aparelho físico.
