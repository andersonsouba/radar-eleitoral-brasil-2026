"""Atualiza, valida e publica um snapshot local atômico; falha mantém a base anterior."""
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
import argparse
import json
import os
import sys
import uuid
import pyarrow as pa
import pyarrow.parquet as pq
from collect import Collector, catalog, discover, download, now, result, write_json
from electoral import iter_candidates, metadata, municipal_leaders, normalize_result, number, decimal
from city_votes import municipal_candidates

ROOT = Path(__file__).resolve().parents[1]
REGIONS = {'1': 'Norte', '2': 'Nordeste', '3': 'Sudeste', '4': 'Sul', '5': 'Centro-Oeste'}


def promote(public, snapshot, summary):
    if summary.get('ufs') != 27 or summary.get('municipalities', 0) < 1 or not summary.get('validated'):
        raise ValueError('Snapshot incompleto não pode substituir a base válida')
    if not (snapshot / 'overview.json').is_file() or not (snapshot / 'municipalities.json').is_file():
        raise ValueError('Arquivos essenciais ausentes')
    write_json(public / 'current.json', {'version': snapshot.name, 'base': '/data/snapshots/' + snapshot.name, **summary})


class FactWriter:
    def __init__(self, path):
        self.path = path; self.writer = None; self.buffer = []; self.count = 0
    def add(self, rows):
        self.buffer.extend(rows); self.count += len(rows)
        if len(self.buffer) >= 20000:
            self.flush()
    def flush(self):
        if self.buffer:
            table = pa.Table.from_pylist(self.buffer)
            if self.writer is None:
                self.writer = pq.ParquetWriter(self.path, table.schema, compression='zstd')
            self.writer.write_table(table); self.buffer.clear()
    def close(self):
        self.flush()
        if self.writer:
            self.writer.close()


def build(collector, settings, states, catalog_source, version):
    dest = ROOT / 'public/data/snapshots' / version; dest.mkdir(parents=True, exist_ok=False)
    processed = ROOT / 'data/processed' / version; processed.mkdir(parents=True, exist_ok=False)
    national_raw, national_source = result(collector, settings, 'br', 1)
    president = normalize_result(national_raw, 'BR', national_source)
    state_summaries = []; municipalities = []; candidates = []; candidate_dims = president['candidates'].copy()
    state_facts = []; party_facts = []; metadata_facts = []; territorial = []; manifest = [catalog_source, national_source]
    checks = []; divergences = []; total_rows = 0; winner_counts = Counter(); pending = []; ties = Counter()
    received_dates = [national_source['collectedAt'], catalog_source['collectedAt']]
    for state in states:
        uf = state['cd']; offices = [1, 3, 5, 6, 8 if uf == 'df' else 7]
        print(f'ETL {uf.upper()}: {len(state["mu"])} municípios', flush=True)
        state_results = {}; state_raws = {}; inverse = {}; aggregates = defaultdict(Counter)
        for office in offices:
            raw, source = result(collector, settings, uf, office); manifest.append(source)
            received_dates.append(source['collectedAt'])
            normalized = normalize_result(raw, uf, source)
            state_results[str(office)] = normalized; state_raws[office] = raw
            metadata_facts.append({'uf': uf.upper(), 'municipality': '', 'office': office, **normalized['meta']})
            state_facts.extend(normalized['candidates']); party_facts.extend(normalized['parties'])
            if office != 1:
                candidate_dims.extend(normalized['candidates'])
            if office in (6, 7, 8) and not normalized['meta']['final']:
                pending.append({'uf': uf.upper(), 'office': office})
            for c in normalized['candidates']:
                if c['elected']:
                    winner_counts[str(office)] += 1
                    if office in (5, 6, 7, 8):
                        inverse[c['id']] = {'candidate': c, 'cities': [], 'meta': normalized['meta']}
                        candidates.append(c)
        writer = FactWriter(processed / f'FATO_VOTACAO_MUNICIPIO_{uf.upper()}.parquet')
        for mun in state['mu']:
            m = {'id': uf.upper() + '-' + mun['cd'], 'tse': mun['cd'], 'ibge': mun.get('cdi') or None,
                 'name': mun['nm'], 'uf': uf.upper(), 'region': REGIONS.get(str(mun.get('cdi', ''))[:1]), 'capital': mun['c'] == 's'}
            municipalities.append(m)
            city = {**m, 'leaders': {}, 'results': {}, 'partyLeaders': {}}
            municipal_results = {}
            for office in offices:
                raw, source = result(collector, settings, uf, office, mun['cd']); manifest.append(source)
                received_dates.append(source['collectedAt'])
                meta = metadata(raw, source); parent = state_results[str(office)]
                metadata_facts.append({'uf': uf.upper(), 'municipality': mun['cd'], 'office': office, **meta})
                rows = list(iter_candidates(raw)); local_votes = {c['sqcand']: number(c['vap']) for _, _, _, c in rows}
                parent_by_id = {c['id']: c for c in parent['candidates']}
                if set(local_votes) != set(parent_by_id):
                    raise ValueError(f'Candidatos municipais não coincidem com UF: {m["id"]} cargo {office}')
                fact_rows = []
                for _, _, party, c in rows:
                    cid = c['sqcand']; votes = local_votes[cid]
                    fact_rows.append({'round': 1, 'uf': uf.upper(), 'tse': mun['cd'], 'municipality': mun['nm'],
                                      'office': office, 'candidate': cid, 'party': party['sg'], 'votes': votes,
                                      'validVotes': meta['validVotes'], 'percentValid': 100 * votes / meta['validVotes'] if meta['validVotes'] else 0.0,
                                      'percentTse': decimal(c['pvapn']), 'voteDestination': c['dvt']})
                    aggregates[office][cid] += votes
                writer.add(fact_rows)
                # Partidos: votos válidos nominais + legenda, no mesmo cargo.
                local_parties = []
                for group in raw['carg'][0]['agr']:
                    for party in group['par']:
                        total = number(party['tvtn']) + number(party.get('tvtl', '0'))
                        local_parties.append({'party': party['sg'], 'votes': total})
                max_party = max(p['votes'] for p in local_parties)
                city['partyLeaders'][str(office)] = [p for p in local_parties if p['votes'] == max_party and max_party > 0]
                if office in (6, 7, 8):
                    municipal_results[str(office)] = {
                        'candidates': municipal_candidates(parent['candidates'], local_votes, meta['validVotes']),
                        'meta': meta, 'officialMeta': parent['meta']}
                    leadership = municipal_leaders(parent['candidates'], local_votes)
                    leadership['meta'] = meta
                    leadership['officialMeta'] = parent['meta']
                    enriched = []
                    for leader in leadership['leaders']:
                        c = parent_by_id[leader['id']]
                        enriched.append({**c, 'stateVotes': c['votes'], 'votes': leader['votes'],
                                         'percent': 100 * leader['votes'] / meta['validVotes'] if meta['validVotes'] else None})
                        territorial.append({'party': c['party'], 'office': office, 'uf': uf.upper(), 'municipality': m['name'],
                                            'cityId': m['id'], 'candidate': c['name'], 'candidateId': c['id'],
                                            'votes': leader['votes'], 'tie': leadership['status'] == 'tie'})
                    leadership['leaders'] = enriched
                    city['leaders'][str(office)] = leadership
                    if leadership['status'] == 'tie':
                        ties[str(office)] += 1
                    evotes = [local_votes[c['id']] for c in parent['candidates'] if c['elected']]
                    for c in parent['candidates']:
                        if c['elected']:
                            votes = local_votes[c['id']]
                            inverse[c['id']]['cities'].append({**m, 'votes': votes,
                                'percent': 100 * votes / meta['validVotes'] if meta['validVotes'] else None,
                                'rank': 1 + sum(v > votes for v in evotes),
                                'leader': votes > 0 and votes == max(evotes), 'tie': leadership['status'] == 'tie' and votes == max(evotes)})
                else:
                    local_candidates = [{**parent_by_id[c['sqcand']], 'stateVotes': parent_by_id[c['sqcand']]['votes'],
                                         'votes': local_votes[c['sqcand']], 'percent': decimal(c['pvapn'])} for _, _, _, c in rows]
                    # Presidente: situação nacional é a fonte de eleição, nunca a UF ou município.
                    if office == 1:
                        national_by_id = {c['id']: c for c in president['candidates']}
                        for c in local_candidates:
                            c['status'] = national_by_id[c['id']]['status']; c['elected'] = national_by_id[c['id']]['elected']
                    local_candidates.sort(key=lambda c: (-c['votes'], c['id']))
                    city['results'][str(office)] = {'candidates': local_candidates, 'meta': meta, 'seats': parent['seats']}
                    if office == 5:
                        for c in parent['candidates']:
                            if c['elected']:
                                found = next(x for x in local_candidates if x['id'] == c['id'])
                                inverse[c['id']]['cities'].append({**m, 'votes': found['votes'], 'percent': found['percent'],
                                                                  'rank': None, 'leader': False, 'tie': False})
                if uf in ('ac', 'ba', 'df', 'rj', 'sc') and (mun in state['mu'][:2] or mun['c'] == 's') and office in (6, 7, 8):
                    eligible = {c['sqcand'] for _, _, _, c in iter_candidates(state_raws[office]) if c['st'] in ('Eleito', 'Eleito por QP', 'Eleito por média')}
                    top = max((v for cid, v in local_votes.items() if cid in eligible), default=0)
                    expected = sorted(cid for cid, v in local_votes.items() if cid in eligible and v == top and v > 0)
                    actual = sorted(c['id'] for c in city['leaders'][str(office)]['leaders'])
                    if actual != expected:
                        raise ValueError('Amostra divergiu do arquivo oficial')
                    checks.append({'uf': uf.upper(), 'city': m['name'], 'cityId': m['id'], 'office': office,
                                   'expected': expected, 'actual': actual, 'votes': top, 'url': source['url'],
                                   'stateUrl': parent['meta']['url'], 'status': 'PASS', 'sha256': source['sha256']})
            write_json(dest / 'municipalities' / (m['id'] + '.json'), city)
            write_json(dest / 'municipal-votes' / (m['id'] + '.json'), {**m, 'results': municipal_results})
        writer.close(); total_rows += writer.count
        for office in offices:
            diffs = [{'id': c['id'], 'ufVotes': c['votes'], 'municipalSum': aggregates[office][c['id']]} for c in state_results[str(office)]['candidates'] if c['votes'] != aggregates[office][c['id']]]
            if diffs:
                divergences.append({'uf': uf.upper(), 'office': office, 'count': len(diffs), 'examples': diffs[:5],
                                    'reason': 'Arquivos coletados em instantes distintos; soma municipal não coincide com UF.'})
        for detail in inverse.values():
            city_rows = sorted(detail['cities'], key=lambda m: (-m['votes'], m['id']))
            total = detail['candidate']['votes']
            detail.update({'cities': city_rows, 'receivedCount': sum(c['votes'] > 0 for c in city_rows),
                           'leaderCount': sum(c['leader'] and not c['tie'] for c in city_rows),
                           'tiedCount': sum(c['leader'] and c['tie'] for c in city_rows),
                           'concentration5': 100 * sum(m['votes'] for m in city_rows[:5]) / total if total else None,
                           'concentration10': 100 * sum(m['votes'] for m in city_rows[:10]) / total if total else None,
                           'municipalSum': sum(m['votes'] for m in city_rows),
                           'consistent': sum(m['votes'] for m in city_rows) == total})
            write_json(dest / 'candidates' / (detail['candidate']['id'] + '.json'), detail)
        summary = {'uf': uf.upper(), 'name': state['ds'], 'municipalities': len(state['mu']),
                   'ibge': state['mu'][0].get('cdi', '')[:2],
                   'offices': {k: {'seats': v['seats'], 'elected': sum(c['elected'] for c in v['candidates']),
                                   'secondRound': sum(c['secondRound'] for c in v['candidates']),
                                   'meta': v['meta'], 'voteLeaders': v['candidates'][:2], 'highlights': [c for c in v['candidates'] if c['elected'] or c['secondRound']][:4]} for k, v in state_results.items()}}
        state_summaries.append(summary)
        write_json(dest / 'states' / (uf.upper() + '.json'), {**summary, 'results': state_results})
    # Representação e votação nunca são somadas entre cargos.
    party_agg = {}
    for fact in party_facts:
        key = (fact['party'], fact['office'])
        if key not in party_agg:
            party_agg[key] = {'party': fact['party'], 'office': fact['office'], 'nominal': 0, 'legend': None if fact['legend'] is None else 0,
                              'total': 0, 'elected': 0, 'secondRound': 0, 'municipalities': 0, 'ties': 0}
        target = party_agg[key]
        for field in ('nominal', 'total', 'elected', 'secondRound'):
            target[field] += fact[field]
        if fact['legend'] is not None:
            target['legend'] += fact['legend']
    # Presidente nacional inclui exterior; não usar a soma das 27 UFs.
    for party in president['parties']:
        party_agg[(party['party'], 1)] = {**party, 'municipalities': 0, 'ties': 0}
    territories_by_party = defaultdict(list)
    for lead in territorial:
        territories_by_party[lead['party']].append(lead)
    for (party, office), aggregate in party_agg.items():
        relevant = [t for t in territories_by_party[party] if t['office'] == office]
        aggregate['municipalities'] = len({t['cityId'] for t in relevant if not t['tie']})
        aggregate['ties'] = len({t['cityId'] for t in relevant if t['tie']})
        denominator = sum(p['total'] for p in party_agg.values() if p['office'] == office)
        aggregate['percent'] = 100 * aggregate['total'] / denominator if denominator else None
    for fact in party_facts:
        matching = [t for t in territories_by_party[fact['party']] if t['office'] == fact['office'] and t['uf'] == fact['uf']]
        fact['municipalities'] = len({t['cityId'] for t in matching if not t['tie']})
        fact['ties'] = len({t['cityId'] for t in matching if t['tie']})
    for party, rows in territories_by_party.items():
        write_json(dest / 'parties' / (party + '.json'), rows)
    sample_cities = {x['cityId'] for x in checks}
    if len(sample_cities) < 10 or len({x['uf'] for x in checks}) < 5:
        raise ValueError('Amostragem mínima de 5 UFs e 10 municípios não atingida')
    validation = {'schema': 'PASS', 'coverage': 'PASS', 'sampleCities': len(sample_cities),
                  'sampleStates': len({x['uf'] for x in checks}), 'samples': checks,
                  'aggregationDivergences': divergences, 'ties': dict(ties), 'municipalRows': total_rows,
                  'notes': ['Comparações de agregados preservam a divergência quando snapshots diferem.',
                            'Ausência de eleitos confirmados não significa ausência de vagas.',
                            'Situação de candidatura não consta do EA20; não é inferida.']}
    overview = {'title': 'Radar Eleitoral Brasil 2026', 'settings': settings, 'president': president,
                'states': state_summaries, 'counts': dict(winner_counts), 'pending': pending,
                'municipalities': len(municipalities), 'candidates': len(candidate_dims), 'municipalRows': total_rows,
                'partySummary': list(party_agg.values()), 'validation': {k:v for k,v in validation.items() if k != 'samples'},
                'collectionStart': min(received_dates), 'collectionEnd': max(received_dates), 'builtAt': now(),
                'sources': {'catalog': catalog_source, 'president': national_source},
                'governorsElected': winner_counts['3'],
                'governorsSecondRound': sum(s['offices']['3']['secondRound'] > 0 for s in state_summaries)}
    write_json(dest / 'overview.json', overview); write_json(dest / 'municipalities.json', municipalities)
    write_json(dest / 'candidates.json', candidates)
    write_json(dest / 'parties.json', {'national': list(party_agg.values()), 'states': party_facts})
    write_json(dest / 'validation.json', validation); write_json(processed / 'manifest.json', manifest)
    write_json(processed / 'validation.json', validation)
    for name, rows in [('DIM_MUNICIPIO', municipalities), ('DIM_CANDIDATO', candidate_dims), ('FATO_RESULTADO_UF', state_facts),
                       ('FATO_PARTIDO', party_facts), ('METADADOS_TOTALIZACAO', metadata_facts)]:
        pq.write_table(pa.Table.from_pylist(rows), processed / (name + '.parquet'), compression='zstd')
    summary = {'ufs': len(states), 'municipalities': len(municipalities), 'candidates': len(candidate_dims),
               'municipalRows': total_rows, 'municipalVotes': True, 'validated': True, 'collectedAt': max(received_dates), 'builtAt': overview['builtAt'],
               'partial': bool(pending) or not president['meta']['final'], 'aggregationDivergences': len(divergences)}
    promote(ROOT / 'public/data', dest, summary)
    print(json.dumps(summary, ensure_ascii=True), flush=True)
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--resume', help='Retoma coleta bruta existente; mantém horários originais')
    parser.add_argument('--offline', help='Reconstrói uma coleta completa sem rede')
    args = parser.parse_args()
    run = args.offline or args.resume or datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    if not all(c.isalnum() or c in '-_' for c in run):
        parser.error('Identificador de coleta inválido')
    lock = ROOT / '.update.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        parser.error('Outra atualização está em execução (.update.lock)')
    os.close(fd)
    public = ROOT / 'public/data'
    try:
        collector = Collector(ROOT / 'data/raw' / run, resume=bool(args.resume), offline=bool(args.offline))
        config, _ = collector.get('comum/config/ele-c.json'); settings = discover(config)
        states, source = catalog(collector, settings)
        if not args.offline:
            download(collector, settings, states)
        elif not (collector.root / 'complete.json').exists():
            raise ValueError('Coleta incompleta; reconstrução recusada')
        collector.resume = True; collector.offline = True
        version = run + '-' + uuid.uuid4().hex[:8]
        summary = build(collector, settings, states, source, version)
        write_json(public / 'attempt.json', {'status': 'success', 'at': now(), 'run': run, 'summary': summary})
    except Exception as error:
        write_json(public / 'attempt.json', {'status': 'failed', 'at': now(), 'run': run, 'error': str(error)})
        print('FALHA: base anterior preservada. ' + str(error), file=sys.stderr)
        raise
    finally:
        lock.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
