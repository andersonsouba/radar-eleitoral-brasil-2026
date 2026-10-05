"""Malhas IBGE simplificadas para SVG; sem valores eleitorais externos."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
import gzip,json,math,hashlib
from collect import now,write_json
ROOT=Path(__file__).resolve().parents[1]


def get(url):
    b=urlopen(url,timeout=60).read()
    if b[:2]==b'\x1f\x8b':b=gzip.decompress(b)
    return json.loads(b),b


def rings(geometry):
    return [r for poly in (geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]) for r in poly]


def svg(data):
    points=[p for f in data['features'] for r in rings(f['geometry']) for p in r]
    xmin=min(p[0] for p in points);xmax=max(p[0] for p in points);ymin=min(p[1] for p in points);ymax=max(p[1] for p in points)
    scale=min(580/(xmax-xmin),470/(ymax-ymin))
    paths=[]
    for f in data['features']:
        parts=[]
        for ring in rings(f['geometry']):
            # IBGE entrega a geometria já generalizada na qualidade mínima.
            coords=[(round((p[0]-xmin)*scale+10,1),round((ymax-p[1])*scale+10,1)) for p in ring]
            parts.append('M'+'L'.join(f'{x},{y}' for x,y in coords)+'Z')
        paths.append({'id':str(f['properties']['codarea']),'d':''.join(parts)})
    return {'viewBox':f'0 0 {round((xmax-xmin)*scale+20,1)} {round((ymax-ymin)*scale+20,1)}','paths':paths}


def main():
    target=ROOT/'public/maps';target.mkdir(parents=True,exist_ok=True)
    states,b=get('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
    names={str(s['id']):s for s in states}
    requests=[('BR','paises/BR','UF')]+[(s['sigla'],f'estados/{s["id"]}','municipio') for s in states]
    def one(job):
        name,path,level=job
        url=f'https://servicodados.ibge.gov.br/api/v3/malhas/{path}?intrarregiao={level}&formato=application/vnd.geo+json&qualidade=minima'
        data,blob=get(url); output=svg(data)
        if name=='BR':
            for p in output['paths']:p.update({'uf':names[p['id']]['sigla'],'name':names[p['id']]['nome']})
        output['source']={'url':url,'collectedAt':now(),'sha256':hashlib.sha256(blob).hexdigest()}
        write_json(target/(name+'.json'),output)
        print(name,len(output['paths']),flush=True)
    with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(one,requests))

if __name__=='__main__':main()
