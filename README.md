# Radar Eleitoral Brasil 2026

Dashboard executivo local das eleições gerais de 2026, em português, com dados oficiais de produção do TSE e mapas do IBGE. Sem banco pago e sem chamadas do navegador ao TSE.

## Regra principal

A ficha municipal apresenta **somente o deputado estadual/distrital e o deputado federal oficialmente eleitos com mais votos na cidade**. Primeiro identifica os eleitos no arquivo estadual, depois cruza sua votação municipal. Não eleitos jamais entram como líderes. Empates reais são explícitos, sem desempate inventado; votação zero não gera liderança. A consulta específica **Cidades**, dentro de Deputados Estaduais/Distritais e Federais, apresenta todos os candidatos com votação positiva no cargo, inclusive não eleitos. A ficha geral de Municípios mantém os destaques de líderes eleitos.

A lista estadual ordena os eleitos por votos. Cada entrada da sidebar (Estaduais/Distritais e Federais) oferece **Deputados** e **Cidades**. Na primeira, escolha um eleito para ver todas as cidades onde recebeu votos, com lideranças e empates identificados. O filtro “Somente cidades onde liderou” usa `/deputados/:id/liderancas`; a consulta completa usa `/deputados/:id/votos` e é também o padrão dos links antigos. Na segunda, escolha uma cidade para ver todos os candidatos com votação positiva, suas situações oficiais, votos e percentuais locais. Os filtros de nome/partido/número e situação mantêm a posição original no ranking; empates recebem a mesma posição. O cargo distrital substitui o estadual no DF. Senado permanece com seu detalhe próprio.

## Stack

Next.js 16.3.8, React 19.3, TypeScript, Tailwind 4, componentes HTML nativos acessíveis, SVG IBGE, Python 3.12 e PyArrow. Dependências fixadas em `package-lock.json` e `requirements.txt`. CSS institucional neutro; nomes e votos vêm da base oficial.

## Instalação

Requisitos: Node.js compatível com Next.js (usado: 24.19.0), npm e Python 3.12 ou superior com pip.

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Ative a venv para usar o comando curto:

```powershell
.\.venv\Scripts\Activate.ps1
python scripts/update_eleicoes.py
```

Se a política do PowerShell bloquear ativação, chame diretamente `.\.venv\Scripts\python.exe scripts/update_eleicoes.py`. Não é necessário alterar a política do computador.

## Atualização em um comando

```powershell
python scripts/update_eleicoes.py
```

O comando descobre códigos/cargos em EA11, baixa EA12 e os resultados EA20 nacionais, estaduais e municipais, valida ambiente/eleição/turno/cargo/abrangência, identifica os eleitos, grava Parquet, calcula agregados e publica JSON por snapshot. São aproximadamente 28 mil arquivos, com limite global de 40 requisições/s (máximo TSE informado: 100/s), concorrência limitada e encerramento em 403/404/429. A coleta pode levar vários minutos.

O ponteiro `public/data/current.json` só muda depois de concluída a validação. Erros mantêm o snapshot anterior. `attempt.json` registra o sucesso/falha e a interface sinaliza falhas posteriores. Não há atualização automática silenciosa. Cada aba continua usando um snapshot coerente até ser recarregada.

```powershell
# Retomar uma coleta incompleta, preservando horários e hashes dos arquivos já baixados
python scripts/update_eleicoes.py --resume ID_DA_COLETA
# Reconstruir somente uma coleta completa já arquivada, sem rede
python scripts/update_eleicoes.py --offline ID_DA_COLETA
# Mapas: atualização separada, pois a geometria não acompanha cada apuração
python scripts/update_maps.py
```

A retoma usa os arquivos já obtidos e, portanto, NÃO constitui uma coleta temporalmente homogênea. O manifesto conserva a hora real de cada resposta. Para renovar todos os arquivos, use uma nova execução sem `--resume`.

## Execução local

```powershell
npm run dev -- --port 3016
# Produção local
npm run build
npm run start -- --port 3016
```

URL: http://127.0.0.1:3016. O servidor se vincula a 127.0.0.1.

Nesta entrega o Python utilizado está em `../../work/venv/Scripts/python.exe`, relativo ao projeto. Assim, a atualização já pode ser executada com:

```powershell
& '..\..\work\venv\Scripts\python.exe' scripts/update_eleicoes.py
```

## Telas

- Visão geral com cobertura, situação presidencial e partidos.
- Estados: prioridade para Estaduais/Distritais e Federais eleitos; Governador e Senado compactos; todos os candidatos em consulta secundária identificada.
- Municípios: busca por UF/nome sem acento; apenas um líder deputado por cargo, salvo empate real.
- Deputados e Senado: filtro, detalhe, mapa, Top cidades, busca e carregamento incremental da tabela.
- Governadores: mapa e filtro de eleitos/segundo turno.
- Presidente: resultado nacional, mapa/liderança por UF, resultado municipal pela busca.
- Partidos: representação, votos válidos nominais, legenda, participação do cargo e municípios liderados, com empates separados.
- Metodologia: definições, amostras, fontes e limites da coleta.

## Dados e rastreabilidade

- `data/raw/<coleta>/`: respostas oficiais gzip, metadados de HTTP, UTC de coleta e SHA-256.
- `data/processed/<versao>/`: dimensões, fatos Parquet por UF, metadados, manifesto e validação.
- `public/data/snapshots/<versao>/`: JSON por UF, município, eleito e partido; índice pequeno de municípios.
- `public/maps/`: geometria IBGE convertida para caminhos SVG, sem números eleitorais.
- `config/eleicao-2026.json`: calendário documental do TSE, inclusive data do 2º turno quando ainda ausente em EA11.

O Git contém código, mapas, documentação e auditoria compacta. As bases volumosas raw/Parquet/JSON não são versionadas e permanecem nesta entrega local; um clone deve executar o atualizador. Os dados brutos são preservados e não há limpeza automática.

Campos sem fonte disponível ficam nulos: situação de candidatura não é inferida a partir de `dvt`, que significa destinação do voto. Foto oficial não foi incorporada. São preservados os nomes completos, nomes de urna, número, partido, federação/coligação, situação de totalização, turno e votos.

## Validação

```powershell
npm run lint
npm run typecheck
npm run build
python -m unittest discover -s tests -v
python scripts/audit_snapshot.py
# Com o servidor em 3016 e Microsoft Edge instalado:
npm run test:smoke
```

Os testes de navegador usam a base real local. Casos sintéticos existem apenas nos testes unitários. Não se usa simulado no site. Veja `docs/validacao.md`, `docs/fontes.md` e `docs/independent-audit.json`.

## Deploy

Destino solicitado: `https://hubnio.com.br/dashpolitico`. A configuração de produção usa a VPS existente, Docker e a rede `easypanel`, com uma rota Traefik limitada a esse caminho e certificado Let's Encrypt. Outros domínios e rotas são preservados. O repositório é privado.

```sh
docker compose -p radar-eleitoral -f compose.production.yml up -d --build
```

O pacote de implantação deve conter `public/data/current.json`, `attempt.json` e o snapshot completo referenciado. O Dockerfile interrompe o build se o ponteiro estiver ausente. Esses arquivos seguem fora do Git; acompanham o pacote privado de implantação. O ETL continua local e não é exposto como endpoint web.

O caminho é definido durante o build por `NEXT_PUBLIC_BASE_PATH=/dashpolitico`. Sem essa variável, o desenvolvimento local continua na raiz. Para validar o subdiretório em PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/dashpolitico'
npm run build
npm run start -- --port 3016
# Em outro terminal:
$env:TEST_SUBPATH='/dashpolitico'
npm run test:smoke -- tests/browser/subpath.spec.ts
```

O estado efetivo de publicação e as verificações externas ficam em `docs/deploy.md`.

## Limites de interpretação

100% de seções totalizadas não significa confirmação final. O campo `e=s` também pode representar segundo turno; somente os textos oficiais `Eleito`, `Eleito por QP` e `Eleito por média` produzem `elected=true`. Resultados parciais e ausência de atribuição de eleitos são mantidos como tais. A situação presidencial usa exclusivamente a abrangência nacional. Não se calcula score subjetivo nem se estima vagas.

Votos de partidos são válidos nominais + legenda válida no mesmo cargo; votos computados dos candidatos e percentuais oficiais possuem conceitos documentados em `docs/fontes.md`. A concentração é suspensa se o total das cidades divergir do estadual. Empates partidários não são somados às lideranças exclusivas.

Fonte: Tribunal Superior Eleitoral (TSE). Painel independente para análise de dados públicos eleitorais. Resultados e situações eleitorais devem ser conferidos com a publicação oficial da Justiça Eleitoral.

## Revisão local: Deputados e Cidades (09/10/2026)

Revisão aprovada pelo usuário para envio ao Git e publicação em 09/10/2026. Guia e evidências: `docs/consulta-cidades.md`; estado da implantação: `docs/deploy.md`. A geração usa a coleta arquivada de 05/10, sem consulta nova ao TSE.
