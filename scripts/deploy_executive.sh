#!/usr/bin/env bash
set -euo pipefail
base=/opt/radar-eleitoral
release="$base/releases/20261026-executivo"
previous="$base/releases/20261010-municipios"
packages="$base/packages/20261026-executivo"
archive=radar-eleitoral-executivo-20261026.tar.gz
url=https://github.com/andersonsouba/radar-eleitoral-brasil-2026/releases/download/executivo-20261026
version=20261026T145857Z-executivo-c3048bd8
image=radar-eleitoral:20261026-executivo
check=nio-dashpolitico-check-20261026
live_changed=0
mkdir -p "$packages"
cleanup() {
  result=$?
  docker rm -f "$check" >/dev/null 2>&1 || true
  if [ "$result" -ne 0 ] && [ "$live_changed" -eq 1 ]; then
    echo 'Falha após troca; restaurando a implantação anterior.'
    (cd "$previous" && docker compose -p radar-eleitoral -f compose.production.yml up -d --no-build)
  fi
  printf '{"exitCode":%s,"version":"%s","at":"%s"}\n' "$result" "$version" "$(date -u +%FT%TZ)" > "$packages/status.json"
}
trap cleanup EXIT
test -d "$previous"
test "$(docker inspect --format '{{.State.Health.Status}}' nio-dashpolitico)" = healthy
test "$(docker inspect --format '{{.Config.Image}}' nio-dashpolitico)" = radar-eleitoral:20261010-municipios
test ! -e "$release"
curl --fail --location --retry 2 "$url/$archive" -o "$packages/$archive"
curl --fail --location "$url/$archive.sha256" -o "$packages/$archive.sha256"
(cd "$packages" && sha256sum -c "$archive.sha256")
mkdir "$release"
tar --no-same-owner -xzf "$packages/$archive" -C "$release"
cd "$release"
python3 -c 'import json; p=json.load(open("public/data/current.json")); assert p["version"]=="20261026T145857Z-executivo-c3048bd8" and p["executiveRound"]==2 and p["validated"] and not p["partial"]'
echo 'Construindo imagem nova; serviço atual preservado.'
docker build --build-arg NEXT_PUBLIC_BASE_PATH=/dashpolitico -t "$image" .
docker run -d --name "$check" --memory 768m --cap-drop ALL --security-opt no-new-privileges:true -p 127.0.0.1:18086:3000 "$image"
for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:18086/dashpolitico/data/current.json -o "$packages/test-current.json"; then break; fi
  sleep 2
done
cmp public/data/current.json "$packages/test-current.json"
for path in '' /presidente /governadores /estados/AC /municipios/AC-01120 /deputados-federais; do
  curl -fsS "http://127.0.0.1:18086/dashpolitico$path" -o /dev/null
done
curl -fsS "http://127.0.0.1:18086/dashpolitico/data/snapshots/$version/overview.json" -o "$packages/test-overview.json"
python3 -c 'import json,sys; o=json.load(open(sys.argv[1])); assert o["president"]["meta"]["round"]==2 and o["president"]["meta"]["final"]; assert o["governorsElected"]==27 and o["governorsSecondRound"]==6 and o["governorsPending"]==0; assert not o["validation"]["aggregationDivergences"]' "$packages/test-overview.json"
docker rm -f "$check"
echo 'Teste isolado aprovado. Atualizando somente nio-dashpolitico.'
live_changed=1
docker compose -p radar-eleitoral -f compose.production.yml up -d --no-build
for attempt in $(seq 1 60); do
  state=$(docker inspect --format '{{.State.Health.Status}}' nio-dashpolitico)
  if [ "$state" = healthy ]; then break; fi
  sleep 2
done
test "$(docker inspect --format '{{.State.Health.Status}}' nio-dashpolitico)" = healthy
curl -fsS --retry 3 -H 'Cache-Control: no-cache' https://hubnio.com.br/dashpolitico/data/current.json -o "$packages/public-current.json"
cmp public/data/current.json "$packages/public-current.json"
curl -fsS "https://hubnio.com.br/dashpolitico/data/snapshots/$version/overview.json" -o "$packages/public-overview.json"
cmp public/data/snapshots/"$version"/overview.json "$packages/public-overview.json"
echo 'PUBLICADO: https://hubnio.com.br/dashpolitico'
