"""Coleta oficial com limite global, evidência e retomada explícita."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import threading
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from electoral import validate_result

BASE = 'https://resultados.tse.jus.br/oficial'
UFS = set('ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to'.split())


def now():
    return datetime.now(timezone.utc).isoformat()


def write_json(path, data):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    temp.replace(path)


class Collector:
    def __init__(self, root, resume=False, offline=False):
        self.root = Path(root); self.root.mkdir(parents=True, exist_ok=True)
        self.resume = resume or offline; self.offline = offline
        self.lock = threading.Lock(); self.next_request = 0
        self.stop = threading.Event()

    def wait_rate(self):
        with self.lock:
            delay = max(0, self.next_request - time.monotonic())
            self.next_request = max(self.next_request, time.monotonic()) + 1 / 40
        time.sleep(delay)
        if self.stop.is_set():
            raise RuntimeError('Coleta interrompida após falha; cache anterior preservado')

    def get(self, relative, validator=None):
        if '..' in relative or not relative.endswith('.json'):
            raise ValueError('Caminho oficial inválido')
        path = self.root / (relative + '.gz'); meta_path = self.root / (relative + '.meta.json')
        if self.resume and path.exists() and meta_path.exists():
            blob = gzip.decompress(path.read_bytes()); meta = json.loads(meta_path.read_bytes())
            if hashlib.sha256(blob).hexdigest() != meta['sha256']:
                raise ValueError('Cache bruto com hash incorreto')
        else:
            if self.offline:
                raise ValueError('Arquivo ausente na reconstrução offline: ' + relative)
            for attempt in range(3):
                self.wait_rate()
                try:
                    with urlopen(Request(BASE + '/' + relative, headers={'User-Agent': 'RadarEleitoral/1.0 (+local data analysis)'}), timeout=45) as response:
                        blob = response.read()
                        meta = {'url': BASE + '/' + relative, 'collectedAt': now(), 'sha256': hashlib.sha256(blob).hexdigest(),
                                'etag': response.headers.get('ETag'), 'lastModified': response.headers.get('Last-Modified'), 'bytes': len(blob)}
                    break
                except HTTPError as e:
                    if e.code in (403, 404, 429) or attempt == 2:
                        self.stop.set(); raise
                    time.sleep(2 ** attempt)
                except (URLError, TimeoutError):
                    if attempt == 2:
                        self.stop.set(); raise
                    time.sleep(2 ** attempt)
            data = json.loads(blob)
            if data.get('f') != 'o':
                raise ValueError('Resposta não oficial: ' + relative)
            if validator:
                validator(data)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(gzip.compress(blob, compresslevel=3))
            write_json(meta_path, meta)
        data = json.loads(blob)
        if data.get('f') != 'o':
            raise ValueError('Cache não oficial')
        if validator:
            validator(data)
        return data, meta


def discover(config):
    if config.get('f') != 'o':
        raise ValueError('Configuração simulada recusada')
    matches = [p for p in config['pl'] if p['c'] == 'ele2026' and p['dt'] == '04/10/2026']
    if len(matches) != 1:
        raise ValueError('Pleito de 2026 não identificado de forma única')
    poll = matches[0]; offices = {}
    for e in poll['e']:
        if e['t'] != '1':
            continue
        for area in e['abr']:
            for c in area['cp']:
                if int(c['cd']) in (1, 3, 5, 6, 7, 8):
                    offices[int(c['cd'])] = e['cd']
    if set(offices) != {1, 3, 5, 6, 7, 8}:
        raise ValueError('Configuração de cargos incompleta')
    round_two = next((p['dt'] for p in config['pl'] if p['c'] == 'ele2026' and any(e['t'] == '2' and e['cd'] in {x.get('cdt2') for x in poll['e']} for e in p['e'])), None)
    calendar_path = Path(__file__).resolve().parents[1] / 'config/eleicao-2026.json'
    calendar = json.loads(calendar_path.read_text(encoding='utf-8-sig'))
    if calendar['year'] != 2026:
        raise ValueError('Calendário incompatível com a eleição')
    round_two = round_two or calendar['secondRoundDate']
    return {'secondRoundSource': calendar['source'], 'cycle': poll['c'], 'poll': poll['cd'], 'date': poll['dt'], 'offices': offices, 'secondRoundDate': round_two}


def result_path(settings, uf, office, municipality=None):
    e = settings['offices'][office]
    area = uf + (municipality or '')
    return f"{settings['cycle']}/{e}/dados/{uf}/{area}-c{office:04d}-e{int(e):06d}-u.json"


def result(collector, settings, uf, office, municipality=None):
    return collector.get(result_path(settings, uf, office, municipality),
                         lambda d: validate_result(d, settings['offices'][office], office, municipality or uf))


def catalog(collector, settings):
    e = settings['offices'][6]
    raw, source = collector.get(f"{settings['cycle']}/{e}/config/mun-e{int(e):06d}-cm.json")
    states = raw['abr']
    if {s['cd'] for s in states} != UFS or len(states) != 27:
        raise ValueError('Cadastro sem as 27 UFs esperadas')
    seen = set()
    for s in states:
        if not s['mu']:
            raise ValueError('UF sem municípios')
        for m in s['mu']:
            key = (s['cd'], m['cd'])
            if key in seen or len(m['cd']) != 5 or not m['cd'].isdigit():
                raise ValueError('Município duplicado ou código inválido')
            seen.add(key)
    return states, source


def download(collector, settings, states):
    result(collector, settings, 'br', 1)
    jobs = [(s['cd'], c, None) for s in states for c in [1, 3, 5, 6, 8 if s['cd'] == 'df' else 7]]
    jobs += [(s['cd'], c, m['cd']) for s in states for m in s['mu'] for c in [1, 3, 5, 6, 8 if s['cd'] == 'df' else 7]]
    print(f'Coleta oficial: {len(jobs)} arquivos; limite global de 40 req/s', flush=True)
    def fetch(job):
        result(collector, settings, *job)
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(fetch, job) for job in jobs]
        for i, f in enumerate(as_completed(futures), 1):
            try:
                f.result()
            except Exception:
                collector.stop.set()
                for pending in futures:
                    pending.cancel()
                raise
            if i % 500 == 0 or i == len(jobs):
                print(f'Coleta: {i}/{len(jobs)}', flush=True)
    write_json(collector.root / 'complete.json', {'completedAt': now(), 'files': len(jobs) + 3, 'settings': settings})


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(); parser.add_argument('--resume', action='store_true'); parser.add_argument('--run', required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / 'data/raw' / args.run
    c = Collector(root, resume=args.resume)
    config, _ = c.get('comum/config/ele-c.json'); settings = discover(config); states, _ = catalog(c, settings)
    download(c, settings, states)
