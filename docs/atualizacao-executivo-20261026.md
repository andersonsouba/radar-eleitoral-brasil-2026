# Atualização eleitoral do Executivo — 26/10/2026

## Estado

Preparação local concluída; publicação em preparação pelo terminal web da Hostinger aberto pelo usuário. O domínio de produção permanece na versão de 10/10 até concluir teste isolado e troca do serviço.

## Dados

- Catálogo oficial: `https://resultados.tse.jus.br/oficial/comum/config/ele-c.json`.
- Segundo turno presidencial: eleição 6258, resultado nacional incluindo exterior, 27 UFs e 5.571 municípios.
- Governadores: eleição 6260 em AC, AM, DF, ES, RN e TO; eleição 6259 nas demais UFs. O catálogo atual contém seis UFs com segundo turno, em lugar das sete indicadas no snapshot antigo.
- 27 governadores com situação oficial de eleito e totalização final; nenhuma UF pendente nesta coleta.
- Coleta do Executivo: 26/10/2026, 11h58 a 12h03, Brasília; 11.197 arquivos de resultados EA20, além do catálogo. Fontes, SHA-256 e horários individuais preservados nos brutos.
- Snapshot preparado: `20261026T145857Z-executivo-c3048bd8`.
- Base legislativa preservada: `20261005T152605Z-0f9c851a-cidades-7a9853d3`.

## Comportamento

A Presidência, seus mapas por UF e fichas municipais usam os dados do segundo turno. Governadores usam o turno decisivo em cada UF; a consulta “2º turno” inclui as seis UFs que o disputaram mesmo após confirmados seus eleitos. Fontes passam a mostrar o turno. A página inicial e a metodologia identificam a atualização do Executivo, sem apresentar deputados e Senado como coletados novamente.

O atualizador valida ambiente oficial, eleição, cargo, turno e abrangência; a condição de eleito para presidente vem exclusivamente do resultado nacional. A nova base só substitui o ponteiro local após coleta e construção completas. Contagens de candidatos, registros municipais e divergências são recalculadas, preservando a parcela legislativa.

## Validação e retomada

- 25 testes Python aprovados; TypeScript aprovado.
- Build de produção aprovado com `next build --webpack`. O Turbopack apresentou falha interna de processo auxiliar no Windows; a configuração de produção Linux existente não foi alterada.
- Conferência no navegador local das telas Presidente e Governadores, incluindo o filtro das seis UFs.
- Auditoria integral contra os arquivos brutos e preservação do legislativo: `evidencias/executivo-20261026-auditoria.json`.
- Capturas: `evidencias/executivo-20261026-presidente.png` e `evidencias/executivo-20261026-governadores.png`.

Para publicar depois, usar o pacote preparado com código e o snapshot completo. A imagem proposta é `radar-eleitoral:20261026-executivo`; manter como rollback a implantação `/opt/radar-eleitoral/releases/20261010-municipios`. Antes da troca, verificar saúde do serviço atual e o checksum do pacote. Construir a nova imagem e validar em container isolado antes de substituir somente `nio-dashpolitico`. Conferir saúde e os JSON públicos após a publicação. Nenhum comando de implantação foi executado nesta atualização.
