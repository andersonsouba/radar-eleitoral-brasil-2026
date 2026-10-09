# Consultas territoriais — 09/10/2026

Implementação feita em novo clone do repositório privado, a partir de `963bc87`.

## Experiência

As entradas Deputados Estaduais (inclui Distritais) e Deputados Federais preservam o menu atual. Cada uma oferece dois seletores visíveis: **Onde liderou**, com lideranças exclusivas e empates entre eleitos do mesmo cargo, e **Onde recebeu votos**, com todas as cidades com votação nominal positiva. A seleção acompanha a abertura da ficha. O endereço `/deputados/:id/votos` permite recarregar ou compartilhar a segunda consulta; os endereços anteriores preservam a abertura em liderança.

Na ficha, o tipo de consulta é independente da ordenação por votos ou percentual local. Busca, paginação, mapa, posição entre eleitos e navegação para a cidade permanecem disponíveis. Cidades com zero votos são excluídas da nova consulta. A lista municipal de candidatos continua restrita aos líderes eleitos por cargo; esta mudança ordena cidades de um deputado, sem criar ranking municipal completo de candidatos.

## Base e limites

Mesma coleta validada `20261005T152605Z-0f9c851a`, encerrada em 05/10/2026 às 12h37 de Brasília. Nenhuma atualização eleitoral, inferência de eleição ou alteração no ETL. As limitações oficiais da coleta continuam aplicáveis.

## Validação

Teste inicial reproduziu a ausência do novo seletor. Os testes de integração usam o snapshot real para conferir todas as cidades e seus votos, inclusão de municípios sem liderança, exclusão de zero votos, ordenação, filtros, recarregamento, empates, Distrito Federal e Senado.

A inspeção com dados carregados identificou transbordamento na ficha mobile: a largura mínima da grade ultrapassava a tela e a regra dos SVGs do mapa também atingia o ícone. Corrigido com largura mínima zero nos filhos da grade e seleção apenas do SVG direto do mapa. Cenário de 390 px retestado com sucesso. Capturas mobile representam viewport de navegador, não aparelho físico.

Lint, TypeScript e build de produção passaram. Regressão final: 27 testes PASS, 2 ignorados (ausência de municípios pendentes nesta base e captura exclusiva de HTTPS). Evidência: `evidencias/visoes-local.json`. Capturas da ficha carregada: `evidencias/visoes-desktop.png` e `evidencias/visoes-mobile.png`.

Pacote de implantação SHA-256: `5dde5bc7a0c8604e75574a26db744d28850d9a94e625e0f816ead0443c343a2a`. Publicação aguardando verificação no domínio.

## Implantação

Imagem preparada: `radar-eleitoral:20261009-visoes`. Destino: https://hubnio.com.br/dashpolitico. Versão anterior preservada: `/opt/radar-eleitoral/releases/20261005-atualizacao`, imagem `radar-eleitoral:20261005-atualizacao`.
