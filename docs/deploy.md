# Publicação

Destino: https://hubnio.com.br/dashpolitico

Repositório privado: https://github.com/andersonsouba/radar-eleitoral-brasil-2026

## Procedimento

Pacote privado com código, Dockerfile, mapas e snapshot oficial. Build Linux na VPS, container exclusivo `nio-dashpolitico`, sem porta pública própria, na rede existente `easypanel`. Traefik encaminha somente `/dashpolitico` e seus descendentes e solicita TLS pelo resolver existente `letsencrypt`.

O deploy não altera DNS, outros containers, banco de dados, firewall ou configuração do EasyPanel. Para interromper apenas o dashboard: `docker compose -p radar-eleitoral -f compose.production.yml stop`. Preserve o pacote anterior para rollback.

Atualização de dados: execute o ETL local, valide e empacote novamente o snapshot completo antes de reconstruir o container. Não há agendamento automático configurado.

## Verificação

Publicação em andamento; preencher resultado externo após implantação.
