import sys,unittest,tempfile,json,gzip,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from collect import Collector,discover,result_path,write_json
from update_eleicoes import promote
import update_eleicoes
from unittest.mock import patch

class CacheAndDiscovery(unittest.TestCase):
 def test_preserve_last_valid_cache_on_invalid_snapshot(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder); pointer=root/'current.json';pointer.write_bytes(b'{"version":"last-valid"}')
   snap=root/'new';snap.mkdir();(snap/'overview.json').write_text('{}');(snap/'municipalities.json').write_text('[]')
   before=pointer.read_bytes()
   for summary in [{'ufs':26,'municipalities':5000,'validated':True},{'ufs':27,'municipalities':0,'validated':True},{'ufs':27,'municipalities':5571,'validated':False}]:
    with self.assertRaises(ValueError):promote(root,snap,summary)
    self.assertEqual(pointer.read_bytes(),before)
 def test_atomic_success_publishes_versioned_path(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);snap=root/'snapshot';snap.mkdir();(snap/'overview.json').write_text('{}');(snap/'municipalities.json').write_text('[{}]')
   promote(root,snap,{'ufs':27,'municipalities':1,'validated':True})
   self.assertEqual(json.loads((root/'current.json').read_bytes())['base'],'/data/snapshots/snapshot')
 def test_corrupted_raw_cache_rejected(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder); blob=b'{"f":"o"}'
   (root/'file.json.gz').write_bytes(gzip.compress(blob));write_json(root/'file.json.meta.json',{'sha256':'corrupted'})
   with self.assertRaises(ValueError):Collector(root,offline=True).get('file.json')
 def test_simulation_rejected_even_when_hash_valid(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);blob=b'{"f":"s"}'
   (root/'file.json.gz').write_bytes(gzip.compress(blob));write_json(root/'file.json.meta.json',{'sha256':hashlib.sha256(blob).hexdigest()})
   with self.assertRaises(ValueError):Collector(root,offline=True).get('file.json')
 def test_missing_offline_file_is_not_replaced_with_empty_data(self):
  with tempfile.TemporaryDirectory() as folder:
   with self.assertRaises(ValueError):Collector(folder,offline=True).get('file.json')
 def test_discovery_requires_official_and_complete_cargos(self):
  with self.assertRaises(ValueError):discover({'f':'s','pl':[]})
  with self.assertRaises(ValueError):discover({'f':'o','pl':[{'c':'ele2026','dt':'04/10/2026','e':[]}]})
 def test_full_update_failure_keeps_pointer_and_records_error(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);public=root/'public/data';public.mkdir(parents=True)
   pointer=public/'current.json';before=b'{"version":"previous"}';pointer.write_bytes(before)
   cached=root/'data/raw/bad/comum/config';cached.mkdir(parents=True)
   blob=b'{"f":"o","pl":[]}'
   (cached/'ele-c.json.gz').write_bytes(gzip.compress(blob))
   write_json(cached/'ele-c.json.meta.json',{'sha256':hashlib.sha256(blob).hexdigest()})
   with patch.object(update_eleicoes,'ROOT',root),patch.object(sys,'argv',['update','--offline','bad']):
    with self.assertRaises(ValueError):update_eleicoes.main()
   self.assertEqual(pointer.read_bytes(),before)
   self.assertEqual(json.loads((public/'attempt.json').read_bytes())['status'],'failed')
   self.assertFalse((root/'.update.lock').exists())
 def test_url_preserves_five_digit_municipality(self):
  self.assertEqual(result_path({'cycle':'ele2026','offices':{6:'6259'}},'ac',6,'01120'),'ele2026/6259/dados/ac/ac01120-c0006-e006259-u.json')

if __name__=='__main__':unittest.main()
