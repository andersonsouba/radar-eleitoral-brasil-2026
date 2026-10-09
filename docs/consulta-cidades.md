# Revisão local — Deputados e Cidades

Pedido de 09/10/2026: entregar para validação do usuário antes de Git/publicação.

## Comportamento

- **Deputados**, nas seções Estaduais/Distritais e Federais: lista de eleitos; ficha mostra todas as cidades com votos positivos, mapa, votos, percentual e posição entre eleitos. Lideranças e empates são identificados. O filtro “Somente cidades onde liderou” restringe a mesma ficha.
- **Cidades**: busca por UF e município; ranking de todos os candidatos com votos positivos no cargo, incluindo suplentes e demais não eleitos. Filtros por nome, número, partido e situação eleitoral. Empates compartilham posição; filtrar não recalcula o ranking. No DF, consulta de distritais usa o cargo 8.
- A ficha geral em `/municipios/:id` preserva seus destaques de líderes eleitos. Links de cidades na tabela do deputado levam à nova consulta completa do respectivo cargo.
- `% local` usa votos válidos do cargo no município. Situação eleitoral vem do arquivo da UF. Ser o mais votado localmente não determina eleição.

## Prévia e rotas

- `http://127.0.0.1:3018/dashpolitico/deputados-estaduais`
- `http://127.0.0.1:3018/dashpolitico/deputados-federais/cidades`
- Exemplo: `/dashpolitico/deputados-estaduais/cidades/AC-01392`
- Ficha padrão: `/dashpolitico/deputados/:id/votos`; filtro: `/dashpolitico/deputados/:id/liderancas`.

Build local: `NEXT_PUBLIC_BASE_PATH=/dashpolitico npm run build` (no PowerShell, definir `$env:NEXT_PUBLIC_BASE_PATH` antes). Servir na porta 3018. Os testes usam `TEST_BASE_URL=http://127.0.0.1:3018` e `TEST_SUBPATH=/dashpolitico`.

## Dados e reprodução

Não houve nova coleta TSE. Esta revisão deriva do snapshot `20261005T152605Z-0f9c851a`, mantendo a data de coleta, os estados parciais e a divergência de agregação preexistente. Nunca interpretar a data da extensão como nova totalização.

O script `scripts/extend_city_votes.py --processed CAMINHO_DO_SNAPSHOT_PARQUET` copia o snapshot vigente e acrescenta `municipal-votes/:id.json`. Exige que o nome da pasta processada coincida com a versão atual. Só troca o ponteiro após concluir as 5.571 cidades. É uma extensão única por snapshot; para reconstruir novamente, partir da versão original correspondente aos Parquets.

As futuras execuções do coletor em `scripts/update_eleicoes.py` já produzem os novos arquivos e o indicador `municipalVotes`. Dados e temporários continuam ignorados pelo Git: a futura publicação precisa levar também o snapshot completo e seu `current.json`, não apenas o código.

Evidências: `evidencias/cidades-geracao.json` registra os hashes dos 27 Parquets; `evidencias/cidades-auditoria.json` registra a reconciliação independente de todos os votos positivos, situações, percentuais, rankings e cobertura. São 1.797.486 registros candidato/cidade, dos quais 1.400.297 pertencem a não eleitos.

## Validação do usuário

Validação automatizada local: build/TypeScript, ESLint e 20 testes Python passaram. Navegador: 28 cenários aplicáveis passaram entre a rodada completa e um reteste focal; dois foram ignorados por não se aplicarem ao snapshot/ambiente local. O reteste corrigiu o posicionamento vertical da tabela no teste móvel, sem alterar a aplicação. Relatório: `evidencias/cidades-validacao-local.json`.

Conferir as duas entradas da sidebar, abrir um deputado, alternar o filtro de liderança, escolher uma cidade e comparar eleitos/não eleitos. Na tela estreita, deslizar a tabela para ver votos e situação. Os testes de viewport móvel não substituem a validação em aparelho físico.

Revisão aprovada pelo usuário para envio ao Git e publicação em 09/10/2026. Imagem prevista: `radar-eleitoral:20261009-cidades`. Estado efetivo e evidências da implantação: `deploy.md`. Rollback: release e imagem `20261009-visoes`.
