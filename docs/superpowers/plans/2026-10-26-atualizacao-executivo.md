# Atualização eleitoral do Executivo

**Objetivo:** atualizar os dados de presidente e governadores solicitados pelo usuário, com resultados oficiais do turno decisivo.

**Abordagem:** partir do pacote publicado em 10/10, validado por SHA-256. Descobrir o segundo turno pelo catálogo oficial e os vínculos `cdt2`, evitando eleições suplementares. Coletar resultados nacionais, estaduais e municipais de presidente/governador; preservar os arquivos legislativos. Promover novo snapshot somente após conclusão e validação; preservar o anterior para rollback.

**Arquivos:** `scripts/update_executive.py` concentra a atualização; `scripts/electoral.py` valida explicitamente o turno esperado; componentes existentes passam a identificar o turno por metadados e a informar a abrangência da atualização.

- [x] Escrever e executar testes que falham para aceitação explícita do segundo turno e descoberta vinculada ao pleito original.
- [x] Implementar coleta e construção do snapshot, herdando situação presidencial exclusivamente do resultado nacional.
- [x] Corrigir legendas, filtros e metodologia de turnos na interface existente.
- [x] Coletar, auditar preservação do legislativo e conferir os resultados contra os brutos.
- [x] Executar testes Python, TypeScript e build; verificar a interface no navegador.
- [x] Enviar código e pacote validado ao GitHub; publicar pelo terminal web da Hostinger e conferir o domínio público.

**Acesso:** a chave SSH configurada para `nio-admin` foi recusada pela VPS. O usuário posteriormente abriu o terminal web da Hostinger, utilizado para a implantação sem alterar credenciais ou permissões.
