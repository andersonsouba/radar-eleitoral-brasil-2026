"""Auditoria independente dos líderes publicados contra os arquivos brutos oficiais."""
import gzip,json
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]

def main():
 current=json.loads((ROOT/'public/data/current.json').read_bytes());base=ROOT/'public'/current['base'].lstrip('/')
 run=current['version'].rsplit('-',1)[0];rawroot=ROOT/'data/raw'/run
 def raw(uf,office,mu=''):
  return json.loads(gzip.decompress((rawroot/f'ele2026/6259/dados/{uf}/{uf}{mu}-c{office:04}-e006259-u.json.gz').read_bytes()))
 def candidates(d):
  return [c for office in d['carg'] for group in office['agr'] for party in group['par'] for c in party['cand']]
 states={};checks=0;contrasts=[];ties=[];counts=Counter();total_cities=0
 for file in (base/'municipalities').glob('*.json'):
  city=json.loads(file.read_bytes());total_cities+=1;uf=city['uf'].lower()
  for cargo,value in city['leaders'].items():
   office=int(cargo)
   if (uf,office) not in states:
    states[(uf,office)]={c['sqcand'] for c in candidates(raw(uf,office)) if c['st'] in {'Eleito','Eleito por QP','Eleito por média'}}
   eligible=states[(uf,office)];all_candidates=candidates(raw(uf,office,city['tse']))
   votes={c['sqcand']:int(c['vap']) for c in all_candidates};top=max((v for cid,v in votes.items() if cid in eligible),default=0)
   expected={cid for cid,v in votes.items() if cid in eligible and v==top and v>0};actual={c['id'] for c in value['leaders']}
   assert actual==expected,(city['id'],office,expected,actual)
   assert all(c['elected'] and c['status']=='ELEITO' and c['votes']==top for c in value['leaders'])
   if len(actual)>1:
    assert value['status']=='tie';ties.append({'city':city['id'],'office':office,'votes':top,'leaders':list(actual)})
   if len(actual)==1:assert value['status']=='unique'
   if not eligible:assert value['status']=='pending'
   if eligible and top==0:assert value['status']=='no_votes'
   maximum=max(votes.values())
   if actual and maximum>top and any(cid not in eligible and v==maximum for cid,v in votes.items()):
    contrasts.append({'city':city['id'],'office':office,'leaderVotes':top,'nonElectedVotes':maximum})
   counts[value['status']]+=1;checks+=1
 assert total_cities==current['municipalities']
 summary={'result':'PASS','municipalities':total_cities,'municipalityOfficeChecks':checks,'states':len({u for u,c in states}),
          'statuses':dict(counts),'ties':ties,'nonElectedWithHigherVotes':len(contrasts),'contrastExamples':contrasts[:10]}
 (ROOT/'docs/independent-audit.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(summary,ensure_ascii=True),flush=True)
if __name__=='__main__':main()
