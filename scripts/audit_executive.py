"""Confere o snapshot executivo contra cada bruto e a base legislativa anterior."""
import gzip
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import threading
from electoral import iter_candidates, validate_result

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_bytes())


def main():
    current = read(ROOT / 'public/data/current.json')
    base = ROOT / 'public' / current['base'].lstrip('/')
    audit = read(base / 'executive-validation.json')
    old = ROOT / 'public/data/snapshots' / audit['baseVersion']
    run = current['version'].split('-executivo-')[0]
    raw_root = ROOT / 'data/raw' / run
    overview = read(base / 'overview.json')
    original = read(old / 'overview.json')
    candidate_delta = len(overview['president']['candidates']) - len(original['president']['candidates'])
    row_delta = 0
    national = {c['id']: c for c in overview['president']['candidates']}
    checked = 0
    count_lock = threading.Lock()

    def verify(result, office, scope):
        nonlocal checked
        meta = result['meta']
        path = meta['url'].split('/oficial/', 1)[1]
        blob = gzip.decompress((raw_root / (path + '.gz')).read_bytes())
        assert hashlib.sha256(blob).hexdigest() == meta['sha256'], path
        raw = json.loads(blob)
        validate_result(raw, meta['election'], office, scope, round_number=meta['round'])
        expected = {c['sqcand']: c for _, _, _, c in iter_candidates(raw)}
        assert set(expected) == {c['id'] for c in result['candidates']}, path
        for candidate in result['candidates']:
            source = expected[candidate['id']]
            assert candidate['votes'] == int(source['vap']), path
            assert candidate['round'] == int(raw['t']), path
            assert candidate['percent'] == float(source['pvapn'].replace(',', '.')), path
            if office == 1:
                assert candidate['elected'] == national[candidate['id']]['elected'], path
        with count_lock:
            checked += 1

    verify(overview['president'], 1, 'br')
    for state in overview['states']:
        detail = read(base / 'states' / (state['uf'] + '.json'))
        before = read(old / 'states' / (state['uf'] + '.json'))
        candidate_delta += len(detail['results']['3']['candidates']) - len(before['results']['3']['candidates'])
        for office in ('5', '6', '7', '8'):
            assert detail['results'].get(office) == before['results'].get(office)
        for office in (1, 3):
            verify(detail['results'][str(office)], office, state['uf'].lower())
            assert state['offices'][str(office)] == detail['offices'][str(office)]
    municipalities = read(base / 'municipalities.json')
    def audit_city(city_ref):
        name = city_ref['id'] + '.json'
        city = read(base / 'municipalities' / name)
        before = read(old / 'municipalities' / name)
        delta = sum(len(city['results'][str(office)]['candidates']) - len(before['results'][str(office)]['candidates']) for office in (1, 3))
        assert city['leaders'] == before['leaders'], name
        assert city['results']['5'] == before['results']['5'], name
        assert (base / 'municipal-votes' / name).read_bytes() == (old / 'municipal-votes' / name).read_bytes(), name
        for office in (1, 3):
            verify(city['results'][str(office)], office, city_ref['tse'])
        return delta
    with ThreadPoolExecutor(max_workers=8) as pool:
        for index, delta in enumerate(pool.map(audit_city, municipalities), 1):
            row_delta += delta
            if index % 1000 == 0:
                print(f'Auditados {index}/{len(municipalities)} municípios', flush=True)
    for name in ('candidates.json', 'municipalities.json'):
        assert (base / name).read_bytes() == (old / name).read_bytes(), name
    for folder in ('candidates', 'parties'):
        for file in (old / folder).glob('*.json'):
            assert file.read_bytes() == (base / folder / file.name).read_bytes(), str(file)
    assert current['candidates'] == overview['candidates'] == original['candidates'] + candidate_delta
    assert current['municipalRows'] == overview['municipalRows'] == original['municipalRows'] + row_delta
    assert current['aggregationDivergences'] == len(overview['validation']['aggregationDivergences'])
    assert checked == 1 + 27 * 2 + len(municipalities) * 2
    report = {'status': 'PASS', 'version': current['version'], 'officialResultsVerified': checked,
              'municipalities': len(municipalities), 'states': len(overview['states']),
              'legislativeDataPreserved': True, 'governorsElected': overview['governorsElected'],
              'candidates': current['candidates'], 'municipalRows': current['municipalRows'],
              'governorsSecondRound': overview['governorsSecondRound'], 'governorsPending': overview['governorsPending'],
              'president': [{'name': c['name'], 'votes': c['votes'], 'percent': c['percent'], 'status': c['status']} for c in overview['president']['candidates']],
              'aggregationDivergences': audit['aggregationDivergences']}
    write_path = ROOT / 'docs/evidencias/executivo-20261026-auditoria.json'
    write_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True))


if __name__ == '__main__':
    main()
