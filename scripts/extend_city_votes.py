"""Gera uma nova versão local com votação por cidade a partir dos Parquets arquivados."""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import shutil
import uuid
import pyarrow.parquet as pq
from city_votes import municipal_candidates
from collect import write_json, now

ROOT = Path(__file__).resolve().parents[1]


def extend(processed):
    public = ROOT / 'public/data'
    pointer = json.loads((public / 'current.json').read_bytes())
    source = public / 'snapshots' / pointer['version']
    if processed.name != pointer['version']:
        raise ValueError('Parquets devem corresponder exatamente ao snapshot atual')
    version = pointer['version'] + '-cidades-' + uuid.uuid4().hex[:8]
    dest = source.parent / version
    shutil.copytree(source, dest)
    cities = json.loads((source / 'municipalities.json').read_bytes())
    count = positive = unelected = 0
    sources = []
    for uf in sorted({c['uf'] for c in cities}):
        path = processed / f'FATO_VOTACAO_MUNICIPIO_{uf}.parquet'
        sources.append({'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        groups = defaultdict(dict)
        for batch in pq.ParquetFile(path).iter_batches(batch_size=20000, columns=['tse','office','candidate','votes']):
            for row in batch.to_pylist():
                if row['office'] in (6,7,8):
                    key = (row['tse'], str(row['office']))
                    if row['candidate'] in groups[key]:
                        raise ValueError('Votação municipal duplicada')
                    groups[key][row['candidate']] = row['votes']
        state = json.loads((source / 'states' / (uf + '.json')).read_bytes())
        for city in (c for c in cities if c['uf'] == uf):
            old = json.loads((source / 'municipalities' / (city['id'] + '.json')).read_bytes())
            results = {}
            for office in ['6', '8' if uf == 'DF' else '7']:
                parent = state['results'][office]
                meta = old['leaders'][office]['meta']
                rows = municipal_candidates(parent['candidates'], groups.pop((city['tse'], office)), meta['validVotes'])
                results[office] = {'candidates': rows, 'meta': meta, 'officialMeta': parent['meta']}
                positive += len(rows)
                unelected += sum(not c['elected'] for c in rows)
            write_json(dest / 'municipal-votes' / (city['id'] + '.json'), {**city, 'results': results})
            count += 1
        if groups:
            raise ValueError('Municípios sem correspondência no catálogo')
        print(f'{uf}: completo', flush=True)
    if count != pointer['municipalities']:
        raise ValueError('Cobertura incompleta: ponteiro preservado')
    report = {'sourceSnapshot': pointer['version'], 'version': version, 'generatedAt': now(),
              'municipalities': count, 'positiveCandidateCityRows': positive,
              'nonElectedCandidateCityRows': unelected, 'files': sources}
    write_json(dest / 'municipal-votes-manifest.json', report)
    write_json(ROOT / 'docs/evidencias/cidades-geracao.json', report)
    write_json(public / 'current.json', {**pointer, 'version': version, 'base': '/data/snapshots/' + version,
                                        'municipalVotes': True, 'extendedAt': report['generatedAt']})
    print(json.dumps({k: v for k,v in report.items() if k != 'files'}, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--processed', type=Path, required=True)
    extend(parser.parse_args().processed)
