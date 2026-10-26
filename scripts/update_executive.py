"""Atualiza presidente e governadores, preservando a base legislativa validada."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parent))
from collect import Collector, UFS, now, write_json
from electoral import normalize_result, validate_result

ROOT = Path(__file__).resolve().parents[1]


def discover_executive(config):
    if config.get('f') != 'o':
        raise ValueError('Catálogo não oficial')
    first = [p for p in config['pl'] if p['c'] == 'ele2026' and p['dt'] == '04/10/2026']
    if len(first) != 1:
        raise ValueError('Pleito original não identificado')
    original = {}
    for election in first[0]['e']:
        if election['t'] == '1':
            for area in election['abr']:
                for office in area['cp']:
                    if office['cd'] in ('1', '3'):
                        original[office['cd']] = election
    if set(original) != {'1', '3'}:
        raise ValueError('Cargos executivos originais ausentes')
    found = {}
    for poll in config['pl']:
        if poll['c'] != 'ele2026':
            continue
        for election in poll['e']:
            for office, parent in original.items():
                if election['t'] == '2' and election['cd'] == parent.get('cdt2'):
                    if office in found:
                        raise ValueError('Segundo turno ambíguo')
                    areas = [a['cd'] for a in election['abr'] if any(c['cd'] == office for c in a['cp'])]
                    if not areas or (office == '1' and areas != ['br']) or (office == '3' and not set(areas) <= UFS):
                        raise ValueError('Abrangência do segundo turno inválida')
                    found[office] = (election['cd'], areas, poll['dt'])
    if set(found) != {'1', '3'} or found['1'][2] != found['3'][2]:
        raise ValueError('Segundo turno completo não localizado no catálogo oficial')
    return {'president': found['1'][0], 'governor': found['3'][0],
            'governorStates': sorted(found['3'][1]), 'date': found['1'][2],
            'firstGovernor': original['3']['cd']}


def inherit_presidential_status(local, national):
    by_id = {c['id']: c for c in national['candidates']}
    if {c['id'] for c in local['candidates']} != set(by_id):
        raise ValueError('Candidatos presidenciais locais divergem da abrangência nacional')
    for candidate in local['candidates']:
        for field in ('status', 'officialStatus', 'elected', 'secondRound'):
            candidate[field] = by_id[candidate['id']][field]


def summary(result):
    candidates = result['candidates']
    return {'seats': result['seats'], 'elected': sum(c['elected'] for c in candidates),
            'secondRound': sum(c['secondRound'] for c in candidates), 'meta': result['meta'],
            'voteLeaders': candidates[:2],
            'highlights': [c for c in candidates if c['elected'] or c['secondRound']][:4]}


def fetch(collector, settings, uf, office, city=None):
    second = office == 1 or uf in settings['governorStates']
    election = settings['president'] if office == 1 else settings['governor'] if second else settings['firstGovernor']
    area = uf + (city or '')
    path = f'ele2026/{election}/dados/{uf}/{area}-c{office:04d}-e{int(election):06d}-u.json'
    raw, source = collector.get(path, lambda d: validate_result(d, election, office, city or uf, round_number=2 if second else 1))
    return normalize_result(raw, uf, source)


def read(path):
    return json.loads(path.read_bytes())


def refresh_metadata(overview, validation, candidate_delta, row_delta, divergences):
    overview['candidates'] += candidate_delta
    overview['municipalRows'] += row_delta
    groups = {}
    for difference in divergences:
        key = (difference['uf'], difference['office'])
        group = groups.setdefault(key, {'uf': key[0], 'office': key[1], 'count': 0, 'examples': []})
        group['count'] += 1
        if len(group['examples']) < 5:
            group['examples'].append(difference)
    validation['aggregationDivergences'] = [d for d in validation['aggregationDivergences'] if d['office'] not in (1, 3)] + list(groups.values())
    validation['municipalRows'] = overview['municipalRows']
    overview['validation'] = {k: v for k, v in validation.items() if k != 'samples'}


def update(collector, public, run):
    previous = read(public / 'current.json')
    old = public / 'snapshots' / previous['version']
    if not previous.get('validated') or previous.get('ufs') != 27:
        raise ValueError('Base anterior não validada')
    config, config_source = collector.get('comum/config/ele-c.json')
    settings = discover_executive(config)
    municipalities = read(old / 'municipalities.json')
    if len(municipalities) != previous['municipalities'] or {m['uf'].lower() for m in municipalities} != UFS:
        raise ValueError('Cobertura municipal anterior inválida')
    president = fetch(collector, settings, 'br', 1)
    jobs = [(uf, office, None) for uf in sorted(UFS) for office in (1, 3)]
    jobs += [(m['uf'].lower(), office, m['tse']) for m in municipalities for office in (1, 3)]
    print(f'Coleta executiva: {len(jobs) + 1} resultados; limite 40 req/s', flush=True)
    def collect(job):
        fetch(collector, settings, *job)
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(collect, job) for job in jobs]
        for index, future in enumerate(as_completed(futures), 1):
            future.result()
            if index % 500 == 0:
                print(f'Coletados {index}/{len(jobs)}', flush=True)
    write_json(collector.root / 'complete.json', {'at': now(), 'files': len(jobs) + 1})
    collector.resume = True
    collector.offline = True
    version = run + '-executivo-' + uuid.uuid4().hex[:8]
    dest = public / 'snapshots' / version
    print('Construindo snapshot; legislativo preservado', flush=True)
    shutil.copytree(old, dest)
    overview = read(dest / 'overview.json')
    candidate_delta = len(president['candidates']) - len(overview['president']['candidates'])
    row_delta = 0
    manifest = [config_source, president['meta']]
    state_results = {}
    for state in overview['states']:
        uf = state['uf']
        detail = read(dest / 'states' / (uf + '.json'))
        state_results[uf] = {}
        for office in (1, 3):
            result = fetch(collector, settings, uf.lower(), office)
            if office == 3:
                candidate_delta += len(result['candidates']) - len(detail['results']['3']['candidates'])
            if office == 1:
                inherit_presidential_status(result, president)
            detail['results'][str(office)] = result
            state_results[uf][office] = result
            state['offices'][str(office)] = summary(result)
            detail['offices'][str(office)] = summary(result)
            manifest.append(result['meta'])
        write_json(dest / 'states' / (uf + '.json'), detail)
    aggregates = Counter()
    preserved = hashlib.sha256()
    for index, municipality in enumerate(municipalities, 1):
        path = dest / 'municipalities' / (municipality['id'] + '.json')
        city = read(path)
        before = json.dumps(city['leaders'], sort_keys=True)
        for office in (1, 3):
            result = fetch(collector, settings, municipality['uf'].lower(), office, municipality['tse'])
            row_delta += len(result['candidates']) - len(city['results'][str(office)]['candidates'])
            parent = president if office == 1 else state_results[municipality['uf']][3]
            if office == 1:
                inherit_presidential_status(result, president)
            else:
                inherited = {c['id']: c for c in parent['candidates']}
                if {c['id'] for c in result['candidates']} != set(inherited):
                    raise ValueError('Candidatos municipais de governador divergem da UF')
                for candidate in result['candidates']:
                    for field in ('status', 'officialStatus', 'elected', 'secondRound'):
                        candidate[field] = inherited[candidate['id']][field]
            for candidate in result['candidates']:
                candidate['stateVotes'] = next(c['votes'] for c in state_results[municipality['uf']][office]['candidates'] if c['id'] == candidate['id'])
                aggregates[(municipality['uf'], office, candidate['id'])] += candidate['votes']
            city['results'][str(office)] = {'candidates': result['candidates'], 'meta': result['meta'], 'seats': result['seats']}
            high = max(p['total'] for p in result['parties'])
            city['partyLeaders'][str(office)] = [{'party': p['party'], 'votes': p['total']} for p in result['parties'] if p['total'] == high and high > 0]
            manifest.append(result['meta'])
        if json.dumps(city['leaders'], sort_keys=True) != before:
            raise ValueError('Lideranças legislativas alteradas')
        preserved.update(before.encode())
        write_json(path, city)
        if index % 1000 == 0:
            print(f'Construídos {index}/{len(municipalities)} municípios', flush=True)
    divergences = []
    for uf, offices in state_results.items():
        for office, result in offices.items():
            for candidate in result['candidates']:
                local = aggregates[(uf, office, candidate['id'])]
                if local != candidate['votes']:
                    divergences.append({'uf': uf, 'office': office, 'id': candidate['id'], 'stateVotes': candidate['votes'], 'municipalSum': local})
    # Partidos: a representação legislativa permanece byte a byte; o executivo usa o turno decisivo por UF.
    parties = read(dest / 'parties.json')
    parties['states'] = [p for p in parties['states'] if p['office'] not in (1, 3)]
    executive_parties = []
    for offices in state_results.values():
        for office, result in offices.items():
            for party in result['parties']:
                parties['states'].append({**party, 'round': result['meta']['round'], 'municipalities': 0, 'ties': 0})
                if office == 3:
                    executive_parties.append(party)
    governor_parties = {}
    for party in executive_parties:
        target = governor_parties.setdefault(party['party'], {**party, 'nominal': 0, 'total': 0, 'elected': 0, 'secondRound': 0, 'municipalities': 0, 'ties': 0})
        target.pop('uf', None)
        for field in ('nominal', 'total', 'elected', 'secondRound'):
            target[field] += party[field]
    total = sum(p['total'] for p in governor_parties.values())
    for party in governor_parties.values():
        party['percent'] = 100 * party['total'] / total if total else None
    parties['national'] = [p for p in parties['national'] if p['office'] not in (1, 3)] + list(governor_parties.values()) + [{**p, 'municipalities': 0, 'ties': 0} for p in president['parties']]
    write_json(dest / 'parties.json', parties)
    dates = [m['collectedAt'] for m in manifest]
    validation = read(dest / 'validation.json')
    refresh_metadata(overview, validation, candidate_delta, row_delta, divergences)
    write_json(dest / 'validation.json', validation)
    overview['president'] = president
    overview['settings']['executiveRound'] = 2
    overview['settings']['secondRoundDate'] = settings['date']
    overview['settings']['executiveElections'] = settings
    overview['sources']['president'] = president['meta']
    overview['governorsElected'] = sum(s['offices']['3']['elected'] for s in overview['states'])
    overview['governorsSecondRound'] = len(settings['governorStates'])
    overview['governorsPending'] = sum(not s['offices']['3']['meta']['final'] or s['offices']['3']['elected'] == 0 for s in overview['states'])
    overview['counts']['1'] = sum(c['elected'] for c in president['candidates'])
    overview['counts']['3'] = overview['governorsElected']
    overview['partySummary'] = parties['national']
    overview['executiveCollectionStart'] = min(dates)
    overview['executiveCollectionEnd'] = max(dates)
    overview['collectionEnd'] = max(dates)
    overview['builtAt'] = now()
    audit = {'status': 'PASS', 'baseVersion': previous['version'], 'round': 2,
             'settings': settings, 'municipalities': len(municipalities),
             'results': len(jobs) + 1, 'aggregationDivergences': divergences,
             'legislativeLeadersSha256': preserved.hexdigest(),
             'collectionStart': min(dates), 'collectionEnd': max(dates),
             'note': 'Legislativo preservado da base anterior; executivo atualizado no turno decisivo de cada UF.'}
    write_json(dest / 'executive-validation.json', audit)
    write_json(collector.root / 'manifest.json', manifest)
    write_json(dest / 'overview.json', overview)
    pointer = {**previous, 'version': version, 'base': '/data/snapshots/' + version,
               'candidates': overview['candidates'], 'municipalRows': overview['municipalRows'],
               'aggregationDivergences': len(validation['aggregationDivergences']),
               'collectedAt': max(dates), 'builtAt': overview['builtAt'],
               'partial': bool(overview['pending']) or not president['meta']['final'] or overview['governorsPending'] > 0,
               'executiveRound': 2}
    # Única promoção, somente após coleta, construção e validação completas.
    write_json(public / 'current.json', pointer)
    write_json(public / 'attempt.json', {'status': 'success', 'at': now(), 'run': run, 'summary': pointer})
    print(json.dumps(audit, ensure_ascii=True), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--resume', help='Retomar coleta, mantendo os horários individuais originais')
    args = parser.parse_args()
    run = args.resume or datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    if not run or not all(c.isalnum() or c in '-_' for c in run):
        parser.error('Identificador de coleta inválido')
    lock = ROOT / '.update.lock'
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    os.close(fd)
    try:
        collector = Collector(ROOT / 'data/raw' / run, resume=bool(args.resume))
        update(collector, ROOT / 'public/data', run)
    except Exception as error:
        write_json(ROOT / 'public/data/attempt.json', {'status': 'failed', 'at': now(), 'run': run, 'error': str(error)})
        raise
    finally:
        lock.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
