# Validação — Radar Eleitoral Brasil 2026

**FASE:** MVP. **STATUS:** PASSOU COM RESSALVAS DE DADOS E COBERTURA GEOGRÁFICA.

Snapshot validado: `20261005-primeira-coleta-8bc8e63f`.
Coleta: 05/10/2026, **06:13:40–06:25:35**, America/Sao_Paulo.

## Base

| Métrica | Quantidade |
|---|---:|
| UFs | 27 |
| Municípios/unidades municipais no EA12 | 5.571 |
| Candidatos distintos na dimensão | 18.852 |
| Registros candidato × município × cargo | 5.963.334 |
| Deputados Federais confirmados eleitos | 390 |
| Deputados Estaduais confirmados eleitos | 747 |
| Deputados Distritais confirmados eleitos | 24 |
| Senadores confirmados eleitos | 54 |
| Governadores eleitos no 1º turno | 20 |
| UFs com Governador no 2º turno | 7 |
| Presidente oficialmente eleito no arquivo | 0 (situação final pendente) |

Os totais acima são os confirmados no snapshot, não estimativas de todas as vagas. O DF corresponde à unidade eleitoral Brasília no cadastro do TSE.

## Gates executados

| Verificação | Resultado |
|---|---|
| Instalação npm e PyArrow | PASS |
| Lint | PASS, sem erros nem avisos |
| TypeScript | PASS |
| Build Next.js de produção | PASS |
| ETL / regras / cache | 16 testes PASS |
| Browser Microsoft Edge — páginas, navegação, filtros e mobile | 19 testes PASS |
| Schema/ambiente/eleição/turno/UF/cargo, votos negativos e duplicidades | PASS nos arquivos consumidos |
| Cadastro das 27 UFs e municípios contra EA12 | PASS |
| Amostra de arquivos municipais × situação estadual | 13 cidades, 5 UFs, PASS |
| Auditoria independente de TODOS os líderes publicados | 11.142 combinações município/cargo, PASS |
| npm audit — dependências de produção | 0 vulnerabilidades |
| npm audit — incluindo desenvolvimento | 5 alertas altos na cadeia de lint; sem correção disponível no registry consultado |

Os testes automatizados de navegador e a inspeção visual de capturas de desktop/mobile são evidências separadas da auditoria de dados. Não foi feito teste em aparelho móvel físico; a evidência mobile corresponde ao viewport de 390 × 844 no Edge. Capturas estão em `docs/evidencias/` e o resultado completo do navegador em `smoke-completo.json`.

Houve uma falha inicial no seletor do teste do filtro de Estado: o campo foi localizado corretamente como combobox com nome acessível “Estado”. O teste foi corrigido para usar esse contrato acessível e o fluxo passou, seguido de execução completa 19/19. A regra eleitoral não foi alterada para passar testes.

## Teste crítico com dados reais

A auditoria independente lê novamente os arquivos brutos e NÃO chama a função de seleção do ETL.

- 7.326 combinações com líder único.
- 3.812 combinações pendentes de confirmação de eleitos.
- 4 combinações com empate real.
- **1.526 casos em que um não eleito recebeu mais votos locais que o líder eleito. Nenhum não eleito foi publicado como líder.**

Exemplo real: Bujari/AC, Estadual. Não eleito com 809 votos locais; líder entre eleitos com 462. A ficha exibe o eleito com 462, sem listar os demais deputados.

Empates preservados: Estadual em MT-90093 (397 votos); Federal em PR-78638 (58), RS-86665 (378) e RS-88650 (792). Nenhum desempate foi inventado.

Veja `independent-audit.json` para os identificadores e exemplos auditados.

## Amostragem e agregações

Amostras: AC, BA, DF, RJ e SC, incluindo capitais e primeiros municípios do cadastro, 13 cidades distintas. As amostras de BA/Estadual validam explicitamente o estado pendente, em vez de produzir eleitos fictícios. Cada amostra possui URLs estadual e municipal, hash e lista esperada/obtida no JSON de validação do snapshot.

Os totais municipais foram comparados por candidato/cargo com a UF. Há **2 grupos divergentes: Presidente na BA (7 candidatos) e em MG (11 candidatos)**. Os resultados dos arquivos são preservados; não se corrigiram números para fazê-los coincidir. O conjunto é uma coleta de arquivos com timestamps distintos e não uma transação única do TSE. A divergência é registrada como limitação, sem atribuir causalidade definitiva.

Não há divergências nas somas de votos de deputados e senadores desta carga. A concentração territorial é calculada apenas quando a soma municipal coincide com os votos estaduais do candidato.

## Ressalvas reais

1. Sem confirmação final para BA/Estadual; MG/Federal e Estadual; PR/Estadual; SP/Federal e Estadual. As cidades desses grupos exibem pendência.
2. Presidência: 100% das seções, mas `tf=n`, `and=p`, situação dos candidatos vazia. Não há classificação final inferida. A data do eventual segundo turno vem do calendário oficial de 2026.
3. Duas divergências de agregação presidencial, detalhadas acima.
4. Boa Esperança do Norte/MT (TSE 73709, IBGE 5101837) não consta da malha municipal simplificada disponível. A cidade está na busca e na tabela.
5. Situação de candidatura e fotos oficiais não foram enriquecidas; não são inferidas de campos com outro significado.
6. Assinaturas JWS não são verificadas; transporte HTTPS e hashes locais foram usados e documentados.
7. Alertas de desenvolvimento: `braces <=3.0.3`, advisory GHSA-vfj7-8cjw-p6xm, propagado por micromatch/fast-glob/plugin ESLint/ESLint config. A versão disponível no registry era 3.0.3 e o audit não oferecia correção. Não afeta o conjunto de dependências de produção auditado. Não se usou atualização forçada sem correção confirmada.
8. Dashboard publicado em https://hubnio.com.br/dashpolitico; HTTPS e fluxo público validados. Não há atualização agendada. O repositório e o pacote de implantação são privados; as bases brutas/Parquet permanecem locais e o snapshot de leitura acompanha o container. Veja `deploy.md`.

## Reprodução

```powershell
npm run lint
npm run typecheck
npm run build
python -m unittest discover -s tests -v
python scripts/audit_snapshot.py
# Servidor já ativo em http://127.0.0.1:3016
npm run test:smoke
```

O comando de atualização preserva o cache anterior em falha. Isso foi exercitado também no fluxo completo com configuração oficial incompleta, verificando ponteiro inalterado, erro registrado e liberação do lock.

## Ajuste de legibilidade solicitado

Texto base 14 → 16 px, menu 12 → 14 px, textos de apoio de 8–10 → 11–12 px e demais textos pequenos ampliados. Títulos grandes e estrutura de layout preservados. Build e lint PASS; 20 testes locais no subdiretório PASS, incluindo desktop, mobile e navegação pelos mapas. Uma captura exclusiva de HTTPS foi intencionalmente ignorada no servidor local; a captura pública tem execução separada. Evidência em `evidencias/smoke-legibilidade.json`. Sem alteração do ETL, dos dados ou das regras eleitorais.
